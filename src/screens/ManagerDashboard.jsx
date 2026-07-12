import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// SVG Icons (keep your existing Icons object here - it's the same)

const ManagerDashboard = ({ currentUser }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalCategories: 0,
    totalRecipes: 0,
    totalIngredients: 0,
    totalVendors: 0,
    totalPurchases: 0
  })

  // Password show/hide states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile form data
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
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        const [staffRes, categoriesRes, recipesRes, ingredientsRes, vendorsRes, purchasesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllStaff`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllCategory`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllRecipe`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllIngredient`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllVendor`, { headers: { token } }),
          axios.get(`${import.meta.env.VITE_API_URL}/manager/viewAllPurchase`, { headers: { token } })
        ])

        setStats({
          totalStaff: staffRes.data?.data?.length || 0,
          totalCategories: categoriesRes.data?.data?.length || 0,
          totalRecipes: recipesRes.data?.data?.length || 0,
          totalIngredients: ingredientsRes.data?.data?.length || 0,
          totalVendors: vendorsRes.data?.data?.length || 0,
          totalPurchases: purchasesRes.data?.data?.length || 0
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const managerName = currentUser?.name || currentUser?.manager?.name || 'Manager'
  const managerEmail = currentUser?.email || currentUser?.manager?.email || 'manager@email.com'
  const managerPhone = currentUser?.phone || currentUser?.manager?.phone || ''
  const managerDob = currentUser?.dob || currentUser?.manager?.dob || ''
  const managerGender = currentUser?.gender || currentUser?.manager?.gender || ''

  // Load profile data when modal opens
  useEffect(() => {
    if (showProfileModal) {
      setProfileData({
        name: managerName,
        email: managerEmail,
        phone: managerPhone,
        dob: managerDob ? new Date(managerDob).toISOString().split('T')[0] : '',
        gender: managerGender,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setProfileError('')
      setProfileSuccess('')
      setFormErrors({})
      setShowPasswordFields(false)
    }
  }, [showProfileModal, managerName, managerEmail, managerPhone, managerDob, managerGender])

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  // Handle profile input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validate profile form
  const validateProfile = () => {
    const errors = {}
    if (!profileData.name.trim()) errors.name = 'Name is required'
    if (!profileData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!profileData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(profileData.phone)) {
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

  // Update manager profile with password
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return

    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const token = localStorage.getItem('token')
      const userId = currentUser?._id || currentUser?.id

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
        `${import.meta.env.VITE_API_URL}/manager/updateProfile/${userId}`,
        payload,
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        const updatedUser = {
          ...storedUser,
          ...response.data.data,
          manager: response.data.data.manager || storedUser.manager
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        if (currentUser) {
          Object.assign(currentUser, response.data.data)
        }

        setProfileSuccess(response.data.message || 'Profile updated successfully!')
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

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Welcome Section - Fixed for mobile */}
      <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 md:p-8 rounded-2xl min-h-[180px] sm:min-h-[200px] md:min-h-[220px] overflow-hidden bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-emerald-950/40 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-900/20 md:px-14 md:py-10">
        {/* Grid Lines Background */}
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '35px 35px'
          }}></div>
        </div>

        {/* Diagonal Grid Lines */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px),
              linear-gradient(-45deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-emerald-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 sm:w-36 md:w-48 h-24 sm:h-36 md:h-48 bg-emerald-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 sm:w-64 md:w-96 h-40 sm:h-64 md:h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>

        {/* Decorative Corner Lines */}
        <div className="absolute top-3 sm:top-5 left-3 sm:left-5 w-8 sm:w-12 h-8 sm:h-12 border-t-2 border-l-2 border-emerald-500/25 rounded-tl-xl"></div>
        <div className="absolute bottom-3 sm:bottom-5 right-3 sm:right-5 w-8 sm:w-12 h-8 sm:h-12 border-b-2 border-r-2 border-emerald-500/25 rounded-br-xl"></div>
        
        {/* Decorative Circles */}
        <div className="absolute top-1/2 -right-8 w-16 sm:w-20 h-16 sm:h-20 border border-emerald-500/10 rounded-full -translate-y-1/2"></div>
        <div className="absolute top-1/2 -left-8 w-16 sm:w-20 h-16 sm:h-20 border border-emerald-500/10 rounded-full -translate-y-1/2"></div>

        {/* Profile Badge - Top Right Corner - Fixed positioning */}
        <div className="absolute top-2 sm:top-3 md:top-5 right-2 sm:right-3 md:right-5 z-20">
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-all duration-300 cursor-pointer"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-emerald-600/60 to-emerald-800/60 flex items-center justify-center text-emerald-300 text-[10px] xs:text-xs sm:text-sm font-bold border border-emerald-500/30 flex-shrink-0">
              {managerName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden xs:inline text-[10px] sm:text-xs font-medium text-emerald-300/70 group-hover:text-emerald-300 transition-colors duration-300">
              Profile
            </span>
            <span className="text-emerald-400/60 group-hover:text-emerald-300 transition-colors duration-300">
              <Icons.Edit />
            </span>
          </button>
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full pr-12 sm:pr-16 md:pr-20">
          {/* Greeting */}
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <span className="text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 font-medium text-emerald-400/80 tracking-wider uppercase">
              - {getGreeting()} -
            </span>
          </div>

          {/* Name with Icon - Fixed for mobile */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-1 sm:mb-2">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Icons.User />
              </div>
            </div>
            <span className="text-lg sm:text-2xl md:text-3xl font-['Playfair_Display',serif] text-emerald-300 font-semibold truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
              {managerName}
            </span>
          </div>

          {/* Date and Role - Fixed for mobile */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
            <span className="text-[10px] xs:text-xs sm:text-sm text-emerald-400/60">
              Prajain's Resto Cafe
            </span>
            <span className="w-1 h-1 rounded-full bg-emerald-500/30 hidden xs:block"></span>
            <span className="text-[10px] xs:text-xs sm:text-sm text-emerald-400/50 truncate max-w-[120px] xs:max-w-none">
              {formatDate(currentTime)}
            </span>
          </div>

          {/* User Badge - Bottom left - Fixed for mobile */}
          <div className="mt-2 sm:mt-3 md:mt-4 flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
            <span className="text-[8px] xs:text-[10px] sm:text-xs text-emerald-400/40 border border-emerald-500/20 rounded-full px-1.5 xs:px-2 sm:px-3 py-0.5 font-mono truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
              {managerEmail}
            </span>
            <span className="w-px h-3 sm:h-4 bg-emerald-500/20 hidden xs:block"></span>
            <span className="text-[8px] xs:text-[10px] font-medium text-emerald-400/60 px-1.5 xs:px-2 sm:px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-0.5 sm:w-1 h-0.5 sm:h-1 rounded-full bg-emerald-400"></span>
              Manager
            </span>
            <span className="text-[8px] xs:text-[10px] font-medium text-emerald-400/40 px-1.5 xs:px-2 sm:px-3 py-0.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 hidden xs:inline-block">
              {new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* Time Card - Bottom Right - Fixed position */}
        <div className="absolute bottom-2 sm:bottom-3 md:bottom-5 right-2 sm:right-3 md:right-5 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-xl"></div>
            <div className="relative text-right px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20">
              <div className="text-base sm:text-xl md:text-3xl font-bold font-mono text-emerald-300 tracking-wider whitespace-nowrap">
                {formatTime(currentTime)}
              </div>
              <div className="text-[6px] xs:text-[8px] sm:text-[10px] text-emerald-400/50 flex items-center justify-end gap-1">
                <span className="inline-block w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="hidden xs:inline">LIVE ·</span> LOCAL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Fixed for mobile */}
      <div className="grid grid-cols-2 xs:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {[
          { label: 'Total Staff', value: stats.totalStaff, icon: <Icons.Staff /> },
          { label: 'Categories', value: stats.totalCategories, icon: <Icons.Categories /> },
          { label: 'Recipes', value: stats.totalRecipes, icon: <Icons.Recipes /> },
          { label: 'Ingredients', value: stats.totalIngredients, icon: <Icons.Ingredients /> },
          { label: 'Vendors', value: stats.totalVendors, icon: <Icons.Vendors /> },
          { label: 'Purchases', value: stats.totalPurchases, icon: <Icons.Purchases /> }
        ].map((stat, index) => (
          <div
            key={index}
            className="group relative bg-emerald-950/30 border border-emerald-500/15 rounded-xl p-2 sm:p-3 md:p-4 text-center hover:border-emerald-500/30 transition-all duration-300 hover:bg-emerald-950/40 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-8 sm:w-12 md:w-16 h-8 sm:h-12 md:h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
            
            <div className="relative">
              <div className="text-emerald-400/70 group-hover:text-emerald-300 transition-colors duration-300 mb-0.5 flex justify-center">
                {stat.icon}
              </div>
              <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors duration-300">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-[6px] xs:text-[8px] sm:text-[10px] font-medium text-emerald-400/50 uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Modal - Keep your existing modal code */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#120f0c] border border-emerald-500/20 rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-2xl shadow-2xl my-4">
            {/* Modal content - keep your existing code */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-['Playfair_Display',serif] text-emerald-300">
                  Edit Profile
                </h3>
                <p className="text-xs sm:text-sm text-emerald-500/50 mt-1">
                  Update your manager profile information
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false)
                  setProfileError('')
                  setProfileSuccess('')
                }}
                className="text-emerald-500/50 hover:text-emerald-300 transition-colors duration-300 cursor-pointer p-2 hover:bg-white/5 rounded-lg"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4 sm:mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30"></div>
              <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-emerald-300 bg-emerald-500/10 px-3 sm:px-4 py-1 rounded-full border border-emerald-500/20">
                Profile Details
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30"></div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                      formErrors.name ? 'border-red-500/50' : 'border-emerald-500/15'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Email Address <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="manager@example.com"
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                      formErrors.email ? 'border-red-500/50' : 'border-emerald-500/15'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Phone Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="9876543210"
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                      formErrors.phone ? 'border-red-500/50' : 'border-emerald-500/15'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Date of Birth <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={profileData.dob}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                      formErrors.dob ? 'border-red-500/50' : 'border-emerald-500/15'
                    }`}
                  />
                  {formErrors.dob && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.dob}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                    Gender <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    name="gender"
                    value={profileData.gender}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 appearance-none ${
                      formErrors.gender ? 'border-red-500/50' : 'border-emerald-500/15'
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
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors duration-300 text-sm font-medium"
                  >
                    <Icons.Lock />
                    {showPasswordFields ? 'Hide Password Fields' : 'Change Password'}
                  </button>
                </div>

                {showPasswordFields && (
                  <>
                    <div className="md:col-span-2 border-t border-emerald-500/10 pt-4 mt-2">
                      <p className="text-xs text-emerald-400/50 mb-3">Enter your current password and set a new one</p>
                    </div>

                    {/* Current Password */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                        Current Password <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          name="currentPassword"
                          value={profileData.currentPassword}
                          onChange={handleProfileChange}
                          placeholder="Enter current password"
                          className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                            formErrors.currentPassword ? 'border-red-500/50' : 'border-emerald-500/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/50 hover:text-emerald-300 transition-colors duration-300"
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
                        New Password <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={profileData.newPassword}
                          onChange={handleProfileChange}
                          placeholder="Min 6 characters"
                          className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                            formErrors.newPassword ? 'border-red-500/50' : 'border-emerald-500/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/50 hover:text-emerald-300 transition-colors duration-300"
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
                        Confirm New Password <span className="text-emerald-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={profileData.confirmPassword}
                          onChange={handleProfileChange}
                          placeholder="Confirm new password"
                          className={`w-full px-4 py-2.5 sm:py-3 bg-white/5 border rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 ${
                            formErrors.confirmPassword ? 'border-red-500/50' : 'border-emerald-500/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/50 hover:text-emerald-300 transition-colors duration-300"
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

              {profileSuccess && (
                <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                  <Icons.Check />
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {profileError}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-emerald-500/10">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
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

export default ManagerDashboard