import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Icons = {
    Search: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    ),
    Plus: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
    ),
    Close: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Spinner: () => (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    ),
    Toggle: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <circle cx="16" cy="12" r="4" />
        </svg>
    ),
}

const AdminStaff = () => {
    const navigate = useNavigate()
    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [togglingId, setTogglingId] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        dob: '',
        gender: ''
    })
    const [formErrors, setFormErrors] = useState({})

    // Fetch staff
    const fetchStaff = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/viewAllStaff`,
                { headers: { token } }
            )
            if (response.data.status === 'SUCCESS') {
                setStaff(response.data.data || [])
            } else {
                setError(response.data.message || 'Failed to fetch staff')
            }
        } catch (err) {
            if (err.response) {
                const message = err.response.data?.message || 'Error fetching staff'
                if (err.response.status === 401) {
                    setError('Session expired. Please login again.')
                } else if (err.response.status === 403) {
                    setError('Access denied. Admin privileges required.')
                } else {
                    setError(message)
                }
            } else if (err.request) {
                setError('Unable to connect to server. Please check your network.')
            } else {
                setError('Failed to fetch staff. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    // Validation
    const isValidEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return emailRegex.test(email)
    }

    const isValidPhone = (phone) => {
        const phoneRegex = /^[6-9]\d{9}$/
        return phoneRegex.test(phone)
    }

    // Toggle status
    const handleToggleStatus = async (id) => {
        setTogglingId(id)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const response = await axios.patch(
                `${import.meta.env.VITE_API_URL}/admin/toggleStaffStatus/${id}`,
                {},
                { headers: { token } }
            )

            if (response.data.status === 'SUCCESS') {
                setStaff(staff.map(s =>
                    s._id === id ? { ...s, isActive: !s.isActive } : s
                ))
            } else {
                setError(response.data.message || 'Failed to toggle staff status')
            }
        } catch (err) {
            if (err.response) {
                const message = err.response.data?.message || 'Failed to toggle status'
                if (err.response.status === 401) {
                    setError('Session expired. Please login again.')
                } else if (err.response.status === 403) {
                    setError('Access denied. Admin privileges required.')
                } else if (err.response.status === 404) {
                    setError('Staff not found')
                } else {
                    setError(message)
                }
            } else if (err.request) {
                setError('Unable to connect to server. Please check your network.')
            } else {
                setError('Failed to toggle staff status. Please try again.')
            }
        } finally {
            setTogglingId(null)
        }
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Name is required'
        if (!formData.email.trim()) {
            errors.email = 'Email is required'
        } else if (!isValidEmail(formData.email)) {
            errors.email = 'Invalid email address'
        }
        if (!formData.phone.trim()) {
            errors.phone = 'Phone is required'
        } else if (!isValidPhone(formData.phone)) {
            errors.phone = 'Invalid phone number'
        }
        if (!formData.password || formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters'
        }
        if (!formData.dob) errors.dob = 'Date of birth is required'
        if (!formData.gender) errors.gender = 'Gender is required'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleAddStaff = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setSubmitting(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
                dob: formData.dob,
                gender: formData.gender
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/registerStaff`,
                payload,
                { headers: { token } }
            )

            if (response.data.status === 'Success') {
                setShowAddModal(false)
                setFormData({ name: '', email: '', phone: '', password: '', dob: '', gender: '' })
                fetchStaff()
            } else {
                setError(response.data.message || 'Failed to add staff')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add staff')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredStaff = staff.filter(s =>
        s.staff?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staff?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staff?.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
                        Staff Management
                    </h2>
                    <p className="text-sm text-[#998f82] mt-0.5">Manage staff accounts</p>
                </div>
                <button
                    type="button"
                    onClick={() => { setShowAddModal(true); setError(''); setFormErrors({}) }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#c9a962] text-[#0a0805] font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all"
                >
                    <Icons.Plus />
                    Add Staff
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Search />
                </div>
                <input
                    type="text"
                    placeholder="Search staff by name, email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] transition-all"
                />
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {!loading && (
                <p className="text-sm text-[#8b7355] mb-4">{filteredStaff.length} staff found</p>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Icons.Spinner />
                    <span className="ml-3 text-[#998f82]">Loading...</span>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-12 text-[#998f82] bg-white/5 border border-[#c9a962]/10 rounded-lg">
                    <p className="text-lg font-medium text-white">No staff found</p>
                    <p className="text-sm mt-1">Add your first staff member</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredStaff.map((item) => {
                        const staffData = item.staff || {}
                        return (
                            <div
                                key={item._id}
                                className="bg-white/5 border border-[#c9a962]/10 rounded-lg p-4 hover:border-[#c9a962]/30 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-base font-['Playfair_Display',serif] text-white font-semibold">
                                                {staffData.name || 'Unknown'}
                                            </h3>
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${item.isActive
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                }`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-[#998f82]">
                                            <span>{staffData.email || 'N/A'}</span>
                                            <span>{staffData.phone || 'N/A'}</span>
                                            <span>DOB: {staffData.dob ? formatDate(staffData.dob) : 'N/A'}</span>
                                            <span>Gender: {staffData.gender || 'N/A'}</span>
                                            <span>Joined: {item.joiningDate ? formatDate(item.joiningDate) : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(item._id)}
                                            disabled={togglingId === item._id}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${item.isActive
                                                    ? 'text-[#c9a962] hover:bg-[#c9a962]/10 border border-[#c9a962]/20'
                                                    : 'text-[#998f82] hover:bg-white/5 border border-white/10'
                                                }`}
                                        >
                                            {togglingId === item._id ? <Icons.Spinner /> : <Icons.Toggle />}
                                            {item.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-[#120f0c] border border-[#c9a962]/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-['Playfair_Display',serif] text-[#e8d5a3]">Add Staff</h3>
                            <button
                                type="button"
                                onClick={() => { setShowAddModal(false); setError(''); setFormErrors({}) }}
                                className="text-[#998f82] hover:text-white transition-colors"
                            >
                                <Icons.Close />
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[#e6dfd5] mb-1">Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white focus:outline-none focus:border-[#c9a962] transition-all ${formErrors.name ? 'border-red-500/50' : 'border-[#c9a962]/15'
                                            }`}
                                    />
                                    {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#e6dfd5] mb-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white focus:outline-none focus:border-[#c9a962] transition-all ${formErrors.email ? 'border-red-500/50' : 'border-[#c9a962]/15'
                                            }`}
                                    />
                                    {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#e6dfd5] mb-1">Phone *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white focus:outline-none focus:border-[#c9a962] transition-all ${formErrors.phone ? 'border-red-500/50' : 'border-[#c9a962]/15'
                                            }`}
                                    />
                                    {formErrors.phone && <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#e6dfd5] mb-1">DOB *</label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white focus:outline-none focus:border-[#c9a962] transition-all ${formErrors.dob ? 'border-red-500/50' : 'border-[#c9a962]/15'
                                            }`}
                                    />
                                    {formErrors.dob && <p className="text-xs text-red-400 mt-1">{formErrors.dob}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#e6dfd5] mb-1">Gender *</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleFormChange}
                                        className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white focus:outline-none focus:border-[#c9a962] transition-all ${formErrors.gender ? 'border-red-500/50' : 'border-[#c9a962]/15'
                                            }`}
                                    >
                                        <option value="" className='bg-black/100'>Select Gender</option>
                                        <option value="Male" className='bg-black/80'>Male</option>
                                        <option value="Female" className='bg-black/80'>Female</option>
                                        <option value="Other" className='bg-black/80'>Other</option>
                                    </select>
                                    {formErrors.gender && <p className="text-xs text-red-400 mt-1">{formErrors.gender}</p>}
                                </div>

                                {/* Password Field - Full Width with Show/Hide */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                                        Password <span className="text-[#c9a962]">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleFormChange}
                                            placeholder="Min 6 characters"
                                            className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${formErrors.password ? 'border-red-500/50' : 'border-[#c9a962]/15'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {formErrors.password && <p className="text-xs text-red-400 mt-1">{formErrors.password}</p>}
                                    <p className="text-[10px] text-[#8b7355]/70 mt-1 tracking-wide">Password must be at least 6 characters</p>
                                </div>
                            </div>

                            {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#c9a962]/10">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2 bg-[#c9a962] text-[#0a0805] font-bold rounded-lg hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all disabled:opacity-70"
                                >
                                    {submitting ? 'Adding...' : 'Add Staff'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setError(''); setFormErrors({}) }}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[#998f82] hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminStaff