import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ManagerStaff = () => {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Add Staff Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
        `${import.meta.env.VITE_API_URL}/manager/viewAllStaff`,
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
          setError('Access denied. Manager privileges required.')
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

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 'N/A'
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) errors.name = 'Full name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.dob) errors.dob = 'Date of birth is required'
    if (!formData.gender) errors.gender = 'Gender is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add Staff
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
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          dob: '',
          gender: ''
        })
        setFormErrors({})
        fetchStaff()
      } else {
        setError(response.data.message || 'Failed to register staff')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to register staff'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 403) {
          setError('Access denied. Manager privileges required.')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to register staff. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Filter staff
  const filteredStaff = staff.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    const nameMatch = item.staff?.name?.toLowerCase().includes(searchLower) || false
    const emailMatch = item.staff?.email?.toLowerCase().includes(searchLower) || false
    const phoneMatch = item.staff?.phone?.toLowerCase().includes(searchLower) || false
    
    const statusMatch = filterStatus 
      ? (filterStatus === 'active' ? item.isActive : !item.isActive)
      : true
    
    const genderMatch = filterGender 
      ? item.staff?.gender === filterGender
      : true
    
    return (nameMatch || emailMatch || phoneMatch) && statusMatch && genderMatch
  })

  // Get unique genders for filter
  const uniqueGenders = [...new Set(staff.map(item => item.staff?.gender).filter(Boolean))]

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dob: '',
      gender: ''
    })
    setFormErrors({})
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'S'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Dark, elegant colors for avatars
  const getAvatarColor = (name) => {
    const colors = [
      'from-emerald-700/80 to-emerald-900/80',
      'from-teal-700/80 to-teal-900/80',
      'from-cyan-700/80 to-cyan-900/80',
      'from-blue-700/80 to-blue-900/80',
      'from-indigo-700/80 to-indigo-900/80',
      'from-purple-700/80 to-purple-900/80',
      'from-rose-700/80 to-rose-900/80',
      'from-amber-700/80 to-amber-900/80',
      'from-lime-700/80 to-lime-900/80',
      'from-sky-700/80 to-sky-900/80',
      'from-violet-700/80 to-violet-900/80',
      'from-fuchsia-700/80 to-fuchsia-900/80',
      'from-pink-700/80 to-pink-900/80',
      'from-orange-700/80 to-orange-900/80',
      'from-red-700/80 to-red-900/80',
      'from-gray-700/80 to-gray-900/80'
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Staff Management
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            View and manage your staff members
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddModal(true)
            resetForm()
            setError('')
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search staff by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="active" className="bg-black">Active</option>
          <option value="inactive" className="bg-black">Inactive</option>
        </select>

        {/* Gender Filter */}
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 min-w-[140px]"
        >
          <option value="">All Genders</option>
          {uniqueGenders.map((gender) => (
            <option key={gender} value={gender} className="bg-black">{gender}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {(searchTerm || filterStatus || filterGender) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setFilterStatus('')
              setFilterGender('')
            }}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#998f82] hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-[#8b7355] mb-4">
          {filteredStaff.length} {filteredStaff.length === 1 ? 'staff member' : 'staff members'} found
        </p>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-[#998f82]">Loading staff...</span>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12 text-[#998f82] bg-white/5 border border-[#c9a962]/10 rounded-xl">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg font-medium text-white">No staff found</p>
          <p className="text-sm mt-1">
            {searchTerm || filterStatus || filterGender 
              ? 'Try adjusting your search or filters' 
              : 'Add your first staff member to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStaff.map((item) => {
            const avatarColor = getAvatarColor(item.staff?.name || 'Staff')
            const initials = getInitials(item.staff?.name)
            const age = calculateAge(item.staff?.dob)
            
            return (
              <div
                key={item._id}
                className="group relative bg-white/5 border rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-[#c9a962]/40"
                style={{
                  borderColor: item.isActive ? 'rgba(201, 169, 98, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                }}
              >
                {/* Top Right Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border inline-flex items-center ${
                    item.isActive 
                      ? 'bg-green-500/15 text-green-400 border-green-500/25' 
                      : 'bg-red-500/15 text-red-400 border-red-500/25'
                  }`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                      item.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></span>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Left Accent Border */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300 ${
                    item.isActive 
                      ? 'bg-gradient-to-b from-emerald-500/60 via-emerald-600/60 to-teal-700/60' 
                      : 'bg-gradient-to-b from-red-500/60 via-red-600/60 to-red-700/60'
                  }`}
                />

                {/* Content */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 pl-6 pr-20">
                  {/* Avatar - Left */}
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white/90 text-2xl font-bold shadow-lg shadow-black/30 border border-white/10`}>
                      {initials}
                    </div>
                  </div>

                  {/* Info - Middle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                        {item.staff?.name || 'N/A'}
                      </h3>
                      <span className="text-xs font-medium text-[#c9a962]/70 bg-[#c9a962]/10 px-3 py-0.5 rounded-full border border-[#c9a962]/15">
                        Staff
                      </span>
                    </div>

                    {/* Details Grid - 5 columns on desktop */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Email</p>
                        <p className="text-sm text-[#c9a962]/80 truncate">{item.staff?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Phone</p>
                        <p className="text-sm text-[#c9a962]/80">{item.staff?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Gender</p>
                        <p className="text-sm text-[#998f82]">{item.staff?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Age</p>
                        <p className="text-sm text-[#998f82]">{age} years</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Joined</p>
                        <p className="text-sm text-[#998f82]">
                          {item.joiningDate 
                            ? new Date(item.joiningDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#120f0c] border border-[#c9a962]/20 rounded-2xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3]">
                  Add Staff Member
                </h3>
                <p className="text-sm text-[#998f82] mt-1">
                  Register a new staff member to the system
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                  setError('')
                }}
                className="text-[#998f82] hover:text-white transition-colors duration-300 cursor-pointer p-2 hover:bg-white/5 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a962]/30"></div>
              <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-[#e8d5a3] bg-[#c9a962]/10 px-4 py-1 rounded-full border border-[#c9a962]/20">
                Staff Details
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a962]/30"></div>
            </div>

            <form onSubmit={handleAddStaff}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Full Name <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                      formErrors.name ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Email Address <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="staff@example.com"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                      formErrors.email ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Phone Number <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                      formErrors.phone ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Date of Birth <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                      formErrors.dob ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  />
                  {formErrors.dob && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.dob}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Gender <span className="text-[#c9a962]">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 appearance-none ${
                      formErrors.gender ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  >
                    <option value="" className="bg-black">Select Gender</option>
                    <option value="Male" className="bg-black">Male</option>
                    <option value="Female" className="bg-black">Female</option>
                    <option value="Other" className="bg-black">Other</option>
                  </select>
                  <div className="absolute bottom-3 right-3 pointer-events-none">
                    <svg className="w-5 h-5 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {formErrors.gender && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.gender}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Password <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 6 characters"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                      formErrors.password ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Confirm Password <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                      formErrors.confirmPassword ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#c9a962]/10">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding Staff...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Add Staff
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                    setError('')
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[#998f82] hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer font-medium"
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

export default ManagerStaff