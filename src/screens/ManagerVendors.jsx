import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ManagerVendors = () => {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manager/viewAllVendor`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setVendors(response.data.data || [])
      } else {
        setError(response.data.message || 'Failed to fetch vendors')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  // Toggle vendor status
  const handleToggleStatus = async (id) => {
    setTogglingId(id)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/manager/toggleVendorStatus/${id}`,
        {},
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        setVendors(vendors.map(vendor => 
          vendor._id === id ? { ...vendor, isActive: !vendor.isActive } : vendor
        ))
      } else {
        setError(response.data.message || 'Failed to toggle vendor status')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to toggle status'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Vendor not found')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to toggle vendor status. Please try again.')
      }
    } finally {
      setTogglingId(null)
    }
  }

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => 
    vendor.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Get color based on vendor name (consistent per vendor)
  const getColorByVendor = (vendorName) => {
    const colors = ['gold', 'emerald', 'sapphire']
    const hash = vendorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return themeColors[colors[hash % colors.length]]
  }

  // SVG Icons
  const PhoneIcon = () => (
    <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )

  const EmailIcon = () => (
    <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )

  const LocationIcon = () => (
    <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Vendors
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Manage your suppliers and vendors
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
          placeholder="Search vendors by name, email, phone or city..."
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
          <span className="ml-3 text-[#998f82]">Loading vendors...</span>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-12 text-[#998f82]">
          {searchTerm ? 'No vendors match your search' : 'No vendors found. Add your first vendor!'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVendors.map((vendor) => {
            const color = getColorByVendor(vendor.vendorName)
            
            return (
              <div
                key={vendor._id}
                className={`group relative bg-white/5 border rounded-xl p-5 transition-all duration-300 hover:bg-white/10 w-full overflow-hidden`}
                style={{
                  borderColor: vendor.isActive ? color.border : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                {/* Subtle Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none -z-10"
                  style={{
                    background: vendor.isActive ? `radial-gradient(circle at 30% 50%, ${color.primary}08, transparent 70%)` : 'radial-gradient(circle at 30% 50%, rgba(239, 68, 68, 0.05), transparent 70%)',
                  }}
                ></div>

                {/* Left Border Accent - Fixed */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                  style={{
                    background: vendor.isActive 
                      ? `linear-gradient(to bottom, ${color.primary}, ${color.light}, ${color.dark})` 
                      : 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
                    opacity: 0.7,
                  }}
                ></div>

                {/* Content Grid - Fixed Layout */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pl-4">
                  {/* Left - Vendor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                        {vendor.vendorName}
                      </h3>
                      
                      {/* Status Badge */}
                      <span className={`text-xs font-medium px-3 py-0.5 rounded-full border transition-all duration-300 inline-flex items-center whitespace-nowrap ${
                        vendor.isActive 
                          ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
                          vendor.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 min-h-[24px]">
                      {/* Phone */}
                      <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                        <PhoneIcon />
                        <span className="break-words">{vendor.phone}</span>
                      </span>

                      {/* Email */}
                      {vendor.email && (
                        <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <EmailIcon />
                          <span className="break-words">{vendor.email}</span>
                        </span>
                      )}

                      {/* Address - Using Location Icon */}
                      {vendor.address && (vendor.address.city || vendor.address.state) && (
                        <span className="text-sm text-[#8b7355] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <LocationIcon />
                          <span className="break-words">
                            {[vendor.address.city, vendor.address.district, vendor.address.state].filter(Boolean).join(', ')}
                            {vendor.address.pincode && ` - ${vendor.address.pincode}`}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-[#8b7355] mt-2">
                      Added: {new Date(vendor.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Right - Action Buttons - Only Toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(vendor._id)}
                      disabled={togglingId === vendor._id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                        vendor.isActive
                          ? `text-[#c9a962] hover:bg-[#c9a962]/10 border border-[#c9a962]/20`
                          : 'text-[#998f82] hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {togglingId === vendor._id ? (
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="6" />
                          <circle cx={vendor.isActive ? "16" : "8"} cy="12" r="4" />
                        </svg>
                      )}
                      {vendor.isActive ? 'Deactivate' : 'Activate'}
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

export default ManagerVendors