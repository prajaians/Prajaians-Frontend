import { useState, useEffect } from 'react'
import axios from 'axios'

// SVG Icons
const Icons = {
  User: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
}

const QuickAction = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-[#c9a962]/10 rounded-xl hover:border-[#c9a962]/30 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
  >
    <span className="text-[#c9a962] group-hover:scale-110 transition-transform duration-300">{icon}</span>
    <span className="text-[#c5b7a2] text-xs font-medium text-center leading-tight">{label}</span>
  </button>
)

const DashboardStaff = ({ onNavigate }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [staffName, setStaffName] = useState('Staff Member')
  const [staffId, setStaffId] = useState(null)
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  // Profile Modal States
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile Form Data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        setStaffId(user._id || user.id)
        
        let name = 'Staff Member'
        if (user.role === 'staff' && user.staff) {
          name = user.staff.name || 'Staff Member'
        } else if (user.role === 'manager' && user.manager) {
          name = user.manager.name || 'Manager'
        } else if (user.role === 'admin' && user.admin) {
          name = user.admin.name || 'Admin'
        } else if (user.name) {
          name = user.name
        } else if (user.email) {
          name = user.email.split('@')[0]
        }
        setStaffName(name)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      setStaffName('Staff Member')
    }
    setTimeout(() => setMounted(true), 50)
  }, [])

  // Load profile data when modal opens
  useEffect(() => {
    if (showProfileModal && currentUser) {
      const staff = currentUser.staff || currentUser
      setProfileData({
        name: staff.name || currentUser.name || '',
        email: staff.email || currentUser.email || '',
        phone: staff.phone || currentUser.phone || '',
        dob: staff.dob ? new Date(staff.dob).toISOString().split('T')[0] : '',
        gender: staff.gender || currentUser.gender || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setProfileError('')
      setProfileSuccess('')
      setFormErrors({})
      setShowPasswordFields(false)
    }
  }, [showProfileModal, currentUser])

  const greeting = () => {
    const h = time.getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatTime12 = (date) => {
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return { hours: hours.toString().padStart(2, '0'), minutes, seconds, ampm }
  }

  const { hours: hh, minutes: mm, seconds: ss, ampm } = formatTime12(time)

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  // ===== VALIDATION FUNCTIONS =====
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // ===== PROFILE HANDLERS =====
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateProfile = () => {
    const errors = {}
    if (!profileData.name.trim()) errors.name = 'Name is required'
    if (!profileData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(profileData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!profileData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!isValidPhone(profileData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }
    if (!profileData.dob) errors.dob = 'Date of birth is required'
    if (!profileData.gender) errors.gender = 'Gender is required'

    if (showPasswordFields) {
      if (!profileData.currentPassword) {
        errors.currentPassword = 'Current password is required'
      }
      if (!profileData.newPassword) {
        errors.newPassword = 'New password is required'
      } else if (profileData.newPassword.length < 6) {
        errors.newPassword = 'New password must be at least 6 characters'
      }
      if (profileData.newPassword !== profileData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return

    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const token = localStorage.getItem('token')
      const payload = {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
        dob: profileData.dob,
        gender: profileData.gender
      }

      if (showPasswordFields) {
        payload.currentPassword = profileData.currentPassword
        payload.newPassword = profileData.newPassword
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/staff/updateStaff/${staffId}`,
        payload,
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        // Update local storage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        const updatedUser = {
          ...storedUser,
          ...response.data.data,
          staff: response.data.data.staff || storedUser.staff
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Update current user state
        setCurrentUser(updatedUser)
        setStaffName(updatedUser.name || updatedUser.staff?.name || 'Staff Member')

        setProfileSuccess('Profile updated successfully!')
        setTimeout(() => {
          setShowProfileModal(false)
          window.location.reload()
        }, 1500)
      } else {
        setProfileError(response.data.message || 'Failed to update profile')
      }

    } catch (error) {
      console.error('Error updating profile:', error)
      if (error.response) {
        setProfileError(error.response.data?.message || 'Failed to update profile')
      } else if (error.request) {
        setProfileError('Unable to connect to server. Please check your network.')
      } else {
        setProfileError('Failed to update profile. Please try again.')
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handleNavigate = (path) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = `/staffPanel/${path}`
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Hero Welcome Banner ── */}
      <div
        className={`relative overflow-hidden rounded-2xl py-4 border border-[#c9a962]/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ background: 'linear-gradient(135deg, #0f0b06 0%, #1a1208 40%, #0d0a05 100%)' }}
      >
        {/* Ambient grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#c9a962 1px, transparent 3px), linear-gradient(90deg, #c9a962 2px, transparent 3px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Gold glow orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-32 bg-[#c9a962]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-28 bg-[#9a7b4f]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-[#c9a962]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Decorative corner lines */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#c9a962]/30 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#c9a962]/30 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#c9a962]/30 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#c9a962]/30 rounded-br-sm pointer-events-none" />

        {/* Profile Edit Button - Top Right */}
        <div className="absolute top-7 right-9 z-10">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-full hover:bg-[#c9a962]/20 transition-all duration-300 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c9a962]/60 to-[#9a7b4f]/60 flex items-center justify-center text-white text-xs font-bold border border-[#c9a962]/30 flex-shrink-0">
              {staffName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-[10px] font-medium text-[#c9a962]/80 group-hover:text-[#c9a962] transition-colors duration-300">
              Profile
            </span>
            <span className="text-[#c9a962]/60 group-hover:text-[#c9a962] transition-colors duration-300">
              <Icons.Edit />
            </span>
          </button>
        </div>

        <div className="relative px-6 sm:px-10 py-8 sm:py-10 pr-20 sm:pr-24">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left — greeting + name */}
            <div className="space-y-3">
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <span className="w-5 h-px bg-[#c9a962]/60" />
                <span className="text-[#c9a962] text-[10px] font-bold tracking-[0.35em] uppercase">
                  {greeting()}
                </span>
                <span className="w-5 h-px bg-[#c9a962]/60" />
              </div>

              {/* Name - Large & Prominent */}
              <h2
                className="font-['Playfair_Display',serif] font-bold text-white leading-none"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 3.2rem)' }}
              >
                {staffName}
              </h2>

              {/* Role + date row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#c9a962] bg-[#c9a962]/8 border border-[#c9a962]/20 px-3 py-1 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[#c9a962] animate-pulse" />
                  {currentUser?.role === 'staff' ? 'Staff' : currentUser?.role || 'Staff'} · Prajain's Resto Cafe
                </span>
                <span className="text-[#8b7355] text-xs">{formattedDate}</span>
              </div>
            </div>

            {/* Right — segmented digital clock (12-hour format) */}
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              {/* Clock digits */}
              <div className="flex items-end gap-1">
                {/* Hours */}
                <div className="flex gap-0.5">
                  {hh.split('').map((d, i) => (
                    <span
                      key={i}
                      className="font-mono font-bold text-[#e8d5a3] tabular-nums leading-none"
                      style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)' }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span
                  className="font-mono font-bold text-[#c9a962]/60 leading-none pb-0.5"
                  style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)' }}
                >
                  :
                </span>
                {/* Minutes */}
                <div className="flex gap-0.5">
                  {mm.split('').map((d, i) => (
                    <span
                      key={i}
                      className="font-mono font-bold text-[#e8d5a3] tabular-nums leading-none"
                      style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)' }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span
                  className="font-mono font-bold text-[#c9a962]/60 leading-none pb-0.5"
                  style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)' }}
                >
                  :
                </span>
                {/* Seconds */}
                <div className="flex gap-0.5">
                  {ss.split('').map((d, i) => (
                    <span
                      key={i}
                      className="font-mono font-bold text-[#c9a962] tabular-nums leading-none"
                      style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)' }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                {/* AM/PM */}
                <span className="font-mono text-sm font-semibold text-[#c9a962] self-end pb-1 ml-1">
                  {ampm}
                </span>
              </div>

              {/* Thin progress bar — seconds ticker */}
              <div className="w-full lg:w-auto lg:min-w-[220px] h-px bg-[#c9a962]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#c9a962]/40 to-[#c9a962] rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(time.getSeconds() / 59) * 100}%` }}
                />
              </div>

              <span className="text-[#8b7355] text-[10px] tracking-widest uppercase">
                Live · Local Time
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className={`transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="w-4 h-px bg-[#c9a962]/40" />
          <h3 className="text-[#998f82] text-[10px] font-bold tracking-[0.25em] uppercase">
            Quick Actions
          </h3>
          <span className="flex-1 h-px bg-[#c9a962]/10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickAction
            label="Add Category"
            onClick={() => handleNavigate('categories/add')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickAction
            label="Add Subcategory"
            onClick={() => handleNavigate('subcategories/add')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="6" height="6" rx="1" />
                <rect x="13" y="13" width="8" height="8" rx="1" />
                <path strokeLinecap="round" strokeWidth="1.8" d="M9 6h4v7" />
              </svg>
            }
          />
          <QuickAction
            label="Add Vendor"
            onClick={() => handleNavigate('vendors/add')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            }
          />
          <QuickAction
            label="View Categories"
            onClick={() => handleNavigate('categories')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="10" rx="1" />
                <rect width="7" height="5" x="3" y="14" rx="1" />
              </svg>
            }
          />
          <QuickAction
            label="View Vendors"
            onClick={() => handleNavigate('vendors')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
          <QuickAction
            label="Purchases"
            onClick={() => handleNavigate('purchases')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ── Profile Edit Modal ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#120f0c] border border-[#c9a962]/20 rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-['Playfair_Display',serif] text-[#e8d5a3]">
                  Edit Profile
                </h3>
                <p className="text-xs sm:text-sm text-[#998f82] mt-1">
                  Update your staff profile information
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false)
                  setProfileError('')
                  setProfileSuccess('')
                }}
                className="text-[#998f82] hover:text-white transition-colors duration-300 cursor-pointer p-2 hover:bg-white/5 rounded-lg"
              >
                <Icons.Close />
              </button>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center gap-4 mb-4 sm:mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a962]/30"></div>
              <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-[#e8d5a3] bg-[#c9a962]/10 px-3 sm:px-4 py-1 rounded-full border border-[#c9a962]/20">
                Profile Details
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a962]/30"></div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Full Name <span className="text-[#c9a962]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
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
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="staff@example.com"
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
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
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="9876543210"
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
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
                    value={profileData.dob}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
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
                    value={profileData.gender}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 appearance-none ${
                      formErrors.gender ? 'border-red-500/50' : 'border-[#c9a962]/15'
                    }`}
                  >
                    <option value="" className="bg-black">Select Gender</option>
                    <option value="Male" className="bg-black">Male</option>
                    <option value="Female" className="bg-black">Female</option>
                    <option value="Other" className="bg-black">Other</option>
                  </select>
                  <div className="absolute bottom-2.5 sm:bottom-3 right-3 pointer-events-none">
                    <svg className="w-5 h-5 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {formErrors.gender && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.gender}</p>
                  )}
                </div>

                {/* Password Update Section */}
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="flex items-center gap-2 text-[#c9a962] hover:text-[#e8d5a3] transition-colors duration-300 text-sm font-medium"
                  >
                    <Icons.Lock />
                    {showPasswordFields ? 'Hide Password Fields' : 'Change Password'}
                  </button>
                </div>

                {showPasswordFields && (
                  <>
                    <div className="md:col-span-2 border-t border-[#c9a962]/10 pt-4 mt-2">
                      <p className="text-xs text-[#8b7355] mb-3">Enter your current password and set a new one</p>
                    </div>

                    {/* Current Password */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                        Current Password <span className="text-[#c9a962]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={profileData.currentPassword}
                          onChange={handleProfileChange}
                          placeholder="Enter current password"
                          className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                            formErrors.currentPassword ? 'border-red-500/50' : 'border-[#c9a962]/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300"
                        >
                          {showCurrentPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      </div>
                      {formErrors.currentPassword && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.currentPassword}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                        New Password <span className="text-[#c9a962]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={profileData.newPassword}
                          onChange={handleProfileChange}
                          placeholder="Min 6 characters"
                          className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                            formErrors.newPassword ? 'border-red-500/50' : 'border-[#c9a962]/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300"
                        >
                          {showNewPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      </div>
                      {formErrors.newPassword && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.newPassword}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                        Confirm New Password <span className="text-[#c9a962]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={profileData.confirmPassword}
                          onChange={handleProfileChange}
                          placeholder="Confirm new password"
                          className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 ${
                            formErrors.confirmPassword ? 'border-red-500/50' : 'border-[#c9a962]/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300"
                        >
                          {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      </div>
                      {formErrors.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">{formErrors.confirmPassword}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Success Message */}
              {profileSuccess && (
                <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
                  <Icons.Check />
                  {profileSuccess}
                </div>
              )}

              {/* Error Message */}
              {profileError && (
                <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {profileError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#c9a962]/10">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {profileLoading ? (
                    <>
                      <Icons.Spinner />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Icons.Check />
                      Update Profile
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false)
                    setProfileError('')
                    setProfileSuccess('')
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-[#998f82] hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer font-medium text-sm sm:text-base"
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

export default DashboardStaff