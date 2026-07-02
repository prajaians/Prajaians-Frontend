import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ManagerBrands = () => {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  // Fetch brands
  const fetchBrands = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manager/viewAllBrand`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setBrands(response.data.data || [])
      } else {
        setError(response.data.message || 'Failed to fetch brands')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching brands')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  // Toggle brand status
  const handleToggleStatus = async (id) => {
    setTogglingId(id)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/manager/toggleBrandStatus/${id}`,
        {},
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        setBrands(brands.map(brand => 
          brand._id === id ? { ...brand, isActive: !brand.isActive } : brand
        ))
      } else {
        setError(response.data.message || 'Failed to toggle brand status')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to toggle status'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Brand not found')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to toggle brand status. Please try again.')
      }
    } finally {
      setTogglingId(null)
    }
  }

  // Filter brands
  const filteredBrands = brands.filter(brand => 
    brand.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )


  // Theme color system - 3 primary colors from your theme
  const themeColors = {
    gold: {
      primary: '#c9a962',
      light: '#e8d5a3',
      dark: '#9a7b4f',
      glow: 'rgba(201, 169, 98, 0.12)',
      border: 'rgba(201, 169, 98, 0.2)',
      gradient: 'from-[#c9a962] via-[#e8d5a3] to-[#9a7b4f]'
    },
    emerald: {
      primary: '#34d399',
      light: '#6ee7b7',
      dark: '#059669',
      glow: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(52, 211, 153, 0.2)',
      gradient: 'from-[#34d399] via-[#6ee7b7] to-[#059669]'
    },
    sapphire: {
      primary: '#60a5fa',
      light: '#93bbfc',
      dark: '#2563eb',
      glow: 'rgba(96, 165, 250, 0.12)',
      border: 'rgba(96, 165, 250, 0.2)',
      gradient: 'from-[#60a5fa] via-[#93bbfc] to-[#2563eb]'
    }
  }

  // Get color based on brand name (consistent per brand)
  const getColorByBrand = (brandName) => {
    const colors = ['gold', 'emerald', 'sapphire']
    const hash = brandName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return themeColors[colors[hash % colors.length]]
  }

  // SVG Icons
  const BrandIcon = () => (
    <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.82 10.82a1.72 1.72 0 0 0 0 2.44l7 7a1.72 1.72 0 0 0 2.44 0l7.46-7.46A1.72 1.72 0 0 0 21 11.59V4a2 2 0 0 0-2-2h-7.59a1.72 1.72 0 0 0-1.23.51l-6.35 6.31z" />
      <path d="M16 8h.01" />
    </svg>
  )

  const DescriptionIcon = () => (
    <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Brands
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Manage your product brands
          </p>
        </div>

      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search brands by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-[#998f82]">Loading brands...</span>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="text-center py-12 text-[#998f82]">
          {searchTerm ? 'No brands match your search' : 'No brands found. Add your first brand!'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBrands.map((brand) => {
            const color = getColorByBrand(brand.brandName)
            
            return (
              <div
                key={brand._id}
                className={`group relative bg-white/5 border rounded-xl p-5 transition-all duration-300 hover:bg-white/10 w-full overflow-hidden`}
                style={{
                  borderColor: brand.isActive ? color.border : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                {/* Subtle Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none -z-10"
                  style={{
                    background: brand.isActive ? `radial-gradient(circle at 30% 50%, ${color.primary}08, transparent 70%)` : 'radial-gradient(circle at 30% 50%, rgba(239, 68, 68, 0.05), transparent 70%)',
                  }}
                ></div>

                {/* Left Border Accent */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                  style={{
                    background: brand.isActive 
                      ? `linear-gradient(to bottom, ${color.primary}, ${color.light}, ${color.dark})` 
                      : 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
                    opacity: 0.7,
                  }}
                ></div>

                {/* Content Grid */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pl-4">
                  {/* Left - Brand Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                        {brand.brandName}
                      </h3>
                      
                      {/* Status Badge */}
                      <span className={`text-xs font-medium px-3 py-0.5 rounded-full border transition-all duration-300 inline-flex items-center whitespace-nowrap ${
                        brand.isActive 
                          ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
                          brand.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 min-h-[24px]">
                      {brand.description ? (
                        <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <DescriptionIcon />
                          <span className="break-words">{brand.description}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-[#8b7355] italic">
                          No description provided
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-[#8b7355] mt-2">
                      Added: {new Date(brand.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Right - Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(brand._id)}
                      disabled={togglingId === brand._id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                        brand.isActive
                          ? `text-[#c9a962] hover:bg-[#c9a962]/10 border border-[#c9a962]/20`
                          : 'text-[#998f82] hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {togglingId === brand._id ? (
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="6" />
                          <circle cx={brand.isActive ? "16" : "8"} cy="12" r="4" />
                        </svg>
                      )}
                      {brand.isActive ? 'Deactivate' : 'Activate'}
                    </button>

 
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ManagerBrands