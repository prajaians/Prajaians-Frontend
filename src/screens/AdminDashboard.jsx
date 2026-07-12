import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// SVG Icons
const Icons = {
  User: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Time: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  AdminAccess: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
    </svg>
  ),
  Server: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="2" />
      <circle cx="17" cy="15" r="2" />
      <circle cx="7" cy="15" r="2" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const AdminDashboard = ({ currentUser }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [serverStatus, setServerStatus] = useState('checking')

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Check server status on load - using an existing endpoint
  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/auth/login`, { 
          timeout: 5000,
          validateStatus: (status) => status < 500
        })
        setServerStatus('online')
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setServerStatus('online')
        } else if (error.code === 'ECONNABORTED') {
          setServerStatus('offline')
        } else if (error.response) {
          setServerStatus('online')
        } else {
          setServerStatus('offline')
        }
      } finally {
        setLoading(false)
      }
    }
    checkServer()
  }, [])

  const adminName = currentUser?.name || currentUser?.admin?.name || 'Admin'
  const adminEmail = currentUser?.email || currentUser?.admin?.email || 'admin@email.com'

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

  // Check if server status is still loading
  if (serverStatus === 'checking') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-red-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-red-400/60">Checking server status...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Section - Dark Red Theme */}
      <div className="relative mb-8 p-4 sm:p-6 md:p-8 rounded-2xl min-h-[200px] md:min-h-[220px] overflow-hidden bg-gradient-to-br from-red-950/15 via-red-900/15 to-red-950/15 backdrop-blur-xl border border-red-500/20 shadow-2xl shadow-red-900/10 md:px-14 md:py-10">
        
        {/* Grid Lines Background */}
        <div className="absolute inset-0 opacity-[0.09]">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '35px 35px'
          }}></div>
        </div>

        {/* Diagonal Grid Lines */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px),
              linear-gradient(-45deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Glow Effects - Dark Red */}
        <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-red-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-36 bg-red-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-red-500/5 rounded-full blur-3xl"></div>

        {/* Decorative Corner Lines - Dark Red */}
        <div className="absolute top-3 sm:top-5 left-3 sm:left-5 w-8 sm:w-12 h-8 sm:h-12 border-t-2 border-l-2 border-red-500/25 rounded-tl-xl"></div>
        <div className="absolute bottom-3 sm:bottom-5 right-3 sm:right-5 w-8 sm:w-12 h-8 sm:h-12 border-b-2 border-r-2 border-red-500/25 rounded-br-xl"></div>
        
        {/* Decorative Circles */}
        <div className="absolute top-1/2 -right-8 w-16 sm:w-20 h-16 sm:h-20 border border-red-500/10 rounded-full -translate-y-1/2"></div>
        <div className="absolute top-1/2 -left-8 w-16 sm:w-20 h-16 sm:h-20 border border-red-500/10 rounded-full -translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col justify-center h-full">
          {/* Greeting */}
          <div className="flex items-center gap-2 sm:gap-3 ms-12 mb-1">
            <span className="text-xs sm:text-sm px-3 sm:px-4 mt-4 font-medium text-red-400/80 tracking-wider uppercase">
              - {getGreeting()} -
            </span>
          </div>

          {/* Name with Icon */}
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                <Icons.User />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-['Playfair_Display',serif] text-red-300 font-semibold truncate">
              {adminName}
            </span>
          </div>

          {/* Date and Role */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2 ms-2">
            <span className="text-xs sm:text-sm text-red-400/60">
              Prajain's Resto Cafe
            </span>
            <span className="w-1 h-1 rounded-full bg-red-500/30"></span>
            <span className="text-xs sm:text-sm text-red-400/50 truncate">
              {formatDate(currentTime)}
            </span>
          </div>

          {/* User Badge - Bottom left */}
          <div className="mt-2 sm:mt-3 md:mt-4 flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
            <span className="text-[10px] sm:text-xs text-red-400/40 border border-red-500/20 rounded-full px-2 sm:px-3 py-0.5 font-mono truncate max-w-[120px] sm:max-w-[200px]">
              {adminEmail}
            </span>
            <span className="w-px h-3 sm:h-4 bg-red-500/20"></span>
            <span className="text-[8px] sm:text-[10px] font-medium text-red-400/60 px-2 sm:px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-1 sm:gap-1.5">
              <span className="w-0.5 sm:w-1 h-0.5 sm:h-1 rounded-full bg-red-400"></span>
              Administrator
            </span>
            <span className="text-[8px] sm:text-[10px] font-medium text-red-400/40 px-2 sm:px-3 py-0.5 rounded-full bg-red-500/5 border border-red-500/10">
              {new Date().getFullYear()}
            </span>
          </div>
        </div>

        {/* Time Card - Bottom Right */}
        <div className="absolute bottom-3 sm:bottom-4 md:bottom-9 right-3 sm:right-4 md:right-10  z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-xl"></div>
            <div className="relative text-right px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-xl border border-red-500/20 bg-red-950/20">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-red-300 tracking-wider">
                {formatTime(currentTime)}
              </div>
              <div className="text-[8px] sm:text-[10px] text-red-400/50 flex items-center justify-end gap-1 sm:gap-2">
                <span className="inline-block w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                LIVE · LOCAL TIME
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards - Admin Access & Server Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Admin Access Card */}
        <div className="group relative bg-gradient-to-br from-red-950/30 to-red-900/20 border border-red-500/20 rounded-2xl p-6 sm:p-8 hover:border-red-500/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/10 overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
          
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                <Icons.AdminAccess />
              </div>
              {/* Pulse ring */}
              <div className="absolute -inset-2 rounded-2xl border border-red-500/20 animate-pulse opacity-50"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-['Playfair_Display',serif] text-red-300 font-semibold">
                  Admin Access
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-medium">
                  <Icons.CheckCircle className="w-3 h-3" />
                  Active
                </span>
              </div>
              <p className="text-sm text-red-400/60 mt-1">
                Full Administration
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-red-400/40">
                <span className="flex items-center gap-1.5">
                  <Icons.Shield className="w-3.5 h-3.5" />
                  Root Access
                </span>
                <span className="w-px h-3 bg-red-500/20"></span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Server Status Card */}
        <div className="group relative bg-gradient-to-br from-red-950/30 to-red-900/20 border border-red-500/20 rounded-2xl p-6 sm:p-8 hover:border-red-500/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/10 overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />
          
          <div className="relative flex items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                <Icons.Server />
              </div>
              {/* Pulse ring */}
              <div className="absolute -inset-2 rounded-2xl border border-red-500/20 animate-pulse opacity-50"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-['Playfair_Display',serif] text-red-300 font-semibold">
                  Server Status
                </h3>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  serverStatus === 'online' 
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`} />
                  {serverStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-red-400/60 mt-1">
                {serverStatus === 'online' 
                  ? 'Server Running'
                  : 'Server connection lost'
                }
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-red-400/40">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    serverStatus === 'online' ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  {serverStatus === 'online' ? 'Connected' : 'Disconnected'}
                </span>
                <span className="w-px h-3 bg-red-500/20"></span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/50"></span>
                  v{new Date().getFullYear()}.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard