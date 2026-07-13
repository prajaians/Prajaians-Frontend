import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import cafeLogo from '../assets/logo.jpg'

const LoginScreen = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotTip, setShowForgotTip] = useState(false)
  const [particles, setParticles] = useState([])

  // Create floating particles - Golden Snow Effect
  useEffect(() => {
    const particleCount = 35
    const newParticles = []
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 15 + Math.random() * 25,
        size: 2 + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.5
      })
    }
    setParticles(newParticles)
  }, [])

  // Update batch statuses after login
  const updateBatchStatuses = async (token, role) => {
    try {
      // staff and manager each have their own route for this;
      // there's no admin equivalent, so skip the call for admin.
      if (role !== 'staff' && role !== 'manager') return null

      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/${role}/updateBatchStatus`,
        {},
        { headers: { token } }
      )
      console.log('Batch statuses updated on login:', response.data)
      return response.data
    } catch (err) {
      // Silently fail - don't block login if batch update fails.
      // The stock page will refresh statuses on its own via viewStock anyway.
      console.warn('Failed to update batch statuses:', err.message)
      return null
    }
  }

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      // API call matching your backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          email: email.trim(),
          password: password
        }
      )

      const result = response.data

      // Check response status
      if (result.status !== 'Success') {
        throw new Error(result.message || 'Login failed')
      }

      const { user, token } = result

      // Store user data and token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('userRole', user.role)

      if (rememberMe) {
        localStorage.setItem('rememberEmail', email)
      } else {
        localStorage.removeItem('rememberEmail')
      }

      // Refresh batch statuses right away on login (staff/manager only —
      // safely no-ops for admin, and silently ignores failure so it can
      // never block navigation; the stock page refreshes again on its own
      // when it loads, so this is just for immediate freshness).
      await updateBatchStatuses(token, user.role)

      // Redirect based on role
      if (user.role === 'staff') {
        navigate('/staffPanel', { replace: true })
      } else if (user.role === 'manager') {
        navigate('/managerPanel', { replace: true })
      } else if (user.role === 'admin') {
        navigate('/adminPanel', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }

    } catch (err) {
      if (err.response) {
        const status = err.response.status
        const message = err.response.data?.message || 'Login failed'

        // Handle specific error cases from your API
        if (status === 403) {
          // Account deactivated
          setError('Your account has been deactivated. Please contact administrator.')
        }
        else if (status === 401) {
          setError('Invalid email or password. Please try again.')
        } else if (status === 404) {
          setError('Account not found. Please check your email.')
        } else if (status === 400) {
          setError(message)
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('rememberEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0d0906] flex items-center justify-center p-4 md:p-8 font-['Manrope',sans-serif]">


      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#c9a962]/15 via-transparent to-[#9a7b4f]/15 pointer-events-none"></div>
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-[#c9a962]/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#785827]/20 blur-3xl pointer-events-none"></div>

      {/* Golden Particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[540px]">

        {/* Back Button - Left Top Corner */}
        <div className="flex justify-start mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#c5b7a2] hover:text-[#c9a962] transition-all duration-300 px-5 py-2.5 rounded-full border border-[#c9a962]/20 hover:border-[#c9a962]/40 bg-white/5 hover:bg-[#c9a962]/10 backdrop-blur-sm group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-semibold tracking-wider uppercase">Back to Home</span>
          </button>
        </div>

        {/* Premium Login Card */}
        <div className="relative bg-gradient-to-br from-[#120f0c]/95 to-[#0a0805]/95 backdrop-blur-xl border border-[#c9a962]/20 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/60">

          {/* Decorative Elements */}
          <div className="absolute top-5 left-5 w-14 h-14 border-t-2 border-l-2 border-[#c9a962]/30 rounded-tl-xl"></div>
          <div className="absolute bottom-5 right-5 w-14 h-14 border-b-2 border-r-2 border-[#c9a962]/30 rounded-br-xl"></div>
          <div className="absolute top-1/2 -right-12 w-24 h-24 border border-[#c9a962]/10 rounded-full -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute top-1/2 -left-12 w-24 h-24 border border-[#c9a962]/10 rounded-full -translate-y-1/2 pointer-events-none"></div>

          <div className="absolute inset-[1px] rounded-[27px] border border-white/5 pointer-events-none"></div>

          {/* Brand Header - Logo Left, Prajain's Right */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-[#c9a962]/10">
            {/* Logo - Left */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-[#c9a962]/20  rounded-full"></div>
              <div className="relative w-20 h-20 rounded-2xl border-2 border-[#c9a962]/50 shadow-2xl shadow-[#c9a962]/30 overflow-hidden bg-[#f4ede2]">
                <img
                  src={cafeLogo}
                  alt="Prajain's Cafe"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Brand Text - Right */}
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-['Playfair_Display',serif] text-white tracking-widest leading-tight">
                PRAJAIAN'S
              </span>
              {/* Resto Cafe - Smaller Text with More Gap */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[7px] font-semibold text-[#c9a962] tracking-[0.2em] uppercase bg-[#c9a962]/10 px-2.5 py-0.5 rounded-full border border-[#c9a962]/20">
                  Resto Cafe | Since 2023
                </span>
              </div>
            </div>
          </div>

          {/* Sign In Badge */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a962]/30"></div>
            <span className="px-5 py-1.5 text-[10px] font-extrabold tracking-[0.3em] uppercase text-[#e8d5a3] bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-full">
              Sign In
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a962]/30"></div>
          </div>

          {/* Error Message */}
          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-2xl animate-shake ${error.includes('deactivated')
              ? 'bg-yellow-500/10 border border-yellow-500/30'
              : 'bg-red-500/10 border border-red-500/30'
              }`}>
              <div className={`flex items-start gap-3 ${error.includes('deactivated') ? 'text-yellow-400' : 'text-red-400'
                }`}>
                {error.includes('deactivated') ? (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Field */}
            <div>
              <label className="block text-[#f4ede2] text-[11px] font-extrabold mb-1.5 tracking-[0.15em] uppercase">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#8b7355]/50 group-focus-within:text-[#c9a962] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border-2 border-[#c9a962]/15 rounded-xl text-white placeholder-[#938370]/50 focus:outline-none focus:border-[#c9a962] focus:ring-4 focus:ring-[#c9a962]/10 transition-all duration-300 text-sm font-semibold"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
                Enter your registered email address
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[#f4ede2] text-[11px] font-extrabold mb-1.5 tracking-[0.15em] uppercase">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[#8b7355]/50 group-focus-within:text-[#c9a962] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-12 pr-14 py-3.5 bg-white/5 border-2 border-[#c9a962]/15 rounded-xl text-white placeholder-[#938370]/50 focus:outline-none focus:border-[#c9a962] focus:ring-4 focus:ring-[#c9a962]/10 transition-all duration-300 text-sm font-semibold"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8b7355]/50 hover:text-[#c9a962] transition-colors duration-300"
                  onClick={() => setShowPassword(!showPassword)}
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
              <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
                Password must be at least 6 characters
              </p>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-[#c5b7a2] text-xs cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-2 border-[#c9a962]/30 bg-white/5 text-[#c9a962] focus:ring-[#c9a962]/20 focus:ring-2 cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="group-hover:text-[#f4ede2] transition-colors duration-300 font-medium">
                  Remember me
                </span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="text-xs font-bold text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300 uppercase tracking-[0.1em]"
                  onMouseEnter={() => setShowForgotTip(true)}
                  onMouseLeave={() => setShowForgotTip(false)}
                  onFocus={() => setShowForgotTip(true)}
                  onBlur={() => setShowForgotTip(false)}
                >
                  Forgot Password?
                </button>
                {showForgotTip && (
                  <div className="absolute right-0 top-full mt-2 px-5 py-3 bg-[#120f0c] border border-[#c9a962]/30 rounded-xl shadow-2xl shadow-black/60 text-xs text-[#c5b7a2] whitespace-nowrap z-10 animate-fadeIn min-w-[200px]">
                    <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[#120f0c] border-t border-l border-[#c9a962]/30 rotate-45"></div>
                    <p className="font-medium">
                      <span className="text-[#c9a962] font-bold">Contact admin</span> to reset your password
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-extrabold text-sm tracking-[0.15em] rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-[#c9a962]/30 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 uppercase relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </span>
              {/* Shine Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#c9a962]/10 text-center">
            <p className="text-[#c5b7a2] text-xs font-medium">
              New user?{' '}
              <span className="text-[#c9a962] hover:text-[#e8d5a3] transition-colors duration-300 cursor-pointer font-bold hover:underline underline-offset-4">
                Contact your administrator
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes floatParticle {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          10% {
            opacity: 0.9;
            transform: translateY(-10vh) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-50vh) scale(1);
          }
          90% {
            opacity: 0.5;
            transform: translateY(-90vh) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-110vh) scale(0.3);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .particles-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          bottom: -10px;
          background: #c9a962;
          border-radius: 50%;
          box-shadow: 
            0 0 10px #c9a962,
            0 0 20px #c9a962,
            0 0 40px rgba(201, 169, 98, 0.3);
          animation: floatParticle linear infinite;
        }

        .particle:nth-child(odd) {
          box-shadow: 
            0 0 15px #c9a962,
            0 0 30px rgba(201, 169, 98, 0.4);
        }

        .particle:nth-child(even) {
          box-shadow: 
            0 0 8px #e8d5a3,
            0 0 20px rgba(232, 213, 163, 0.3);
        }

        @media (max-width: 768px) {
          .particle {
            display: none;
          }
          .particle:nth-child(-n+10) {
            display: block;
          }
        }

        @media (max-width: 480px) {
          .particle {
            display: none;
          }
          .particle:nth-child(-n+6) {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}

export default LoginScreen