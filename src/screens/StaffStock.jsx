import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Helper function to format quantity with units
const formatQuantity = (quantity, unit) => {
  if (!quantity || quantity === 0) return `0 ${unit}`
  
  const num = Number(quantity)
  
  switch (unit) {
    case 'kg':
      // Display as 9 kg 870 g
      const kgs = Math.floor(num)
      const grams = Math.round((num - kgs) * 1000)
      if (kgs === 0) return `${grams} g`
      if (grams === 0) return `${kgs} kg`
      return `${kgs} kg ${grams} g`
    
    case 'g':
      if (num >= 1000) {
        const kgs = Math.floor(num / 1000)
        const grams = Math.round(num % 1000)
        if (grams === 0) return `${kgs} kg`
        return `${kgs} kg ${grams} g`
      }
      return `${num} g`
    
    case 'ltr':
      if (num >= 1) {
        const liters = Math.floor(num)
        const ml = Math.round((num - liters) * 1000)
        if (liters === 0) return `${ml} ml`
        if (ml === 0) return `${liters} L`
        return `${liters} L ${ml} ml`
      }
      return `${Math.round(num * 1000)} ml`
    
    case 'ml':
      if (num >= 1000) {
        const liters = Math.floor(num / 1000)
        const ml = Math.round(num % 1000)
        if (ml === 0) return `${liters} L`
        return `${liters} L ${ml} ml`
      }
      return `${num} ml`
    
    case 'pcs':
      return `${num} pcs`
    
    default:
      return `${num} ${unit}`
  }
}

// Helper to format quantity for display in table (compact)
const formatQuantityCompact = (quantity, unit) => {
  if (!quantity || quantity === 0) return `0 ${unit}`
  const num = Number(quantity)
  
  switch (unit) {
    case 'kg':
      if (num >= 1) {
        const kgs = Math.floor(num)
        const grams = Math.round((num - kgs) * 1000)
        if (grams === 0) return `${kgs} kg`
        return `${kgs} kg ${grams}g`
      }
      return `${Math.round(num * 1000)} g`
    case 'g':
      if (num >= 1000) {
        const kgs = Math.floor(num / 1000)
        const grams = Math.round(num % 1000)
        if (grams === 0) return `${kgs} kg`
        return `${kgs} kg ${grams}g`
      }
      return `${num} g`
    case 'ltr':
      if (num >= 1) {
        const liters = Math.floor(num)
        const ml = Math.round((num - liters) * 1000)
        if (ml === 0) return `${liters} L`
        return `${liters} L ${ml}ml`
      }
      return `${Math.round(num * 1000)} ml`
    case 'ml':
      if (num >= 1000) {
        const liters = Math.floor(num / 1000)
        const ml = Math.round(num % 1000)
        if (ml === 0) return `${liters} L`
        return `${liters} L ${ml}ml`
      }
      return `${num} ml`
    case 'pcs':
      return `${num} pcs`
    default:
      return `${num} ${unit}`
  }
}

const StaffStock = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [updatingBatches, setUpdatingBatches] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [stockData, setStockData] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [expandedItems, setExpandedItems] = useState({})
  const [batchUpdateResult, setBatchUpdateResult] = useState(null)

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (batchUpdateResult) {
      const timer = setTimeout(() => {
        setBatchUpdateResult(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [batchUpdateResult])

  // Get base URL for images
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
        return imagePath

  }

  // Update batch statuses
  const updateBatchStatuses = async () => {
    setUpdatingBatches(true)
    setBatchUpdateResult(null)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/staff/updateBatchStatus`,
        {},
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        setBatchUpdateResult({
          success: true,
          message: response.data.message,
          updatedCount: response.data.data?.updatedCount || 0,
          updates: response.data.data?.updates || []
        })
      } else {
        setBatchUpdateResult({
          success: false,
          message: response.data.message || 'Failed to update batch statuses'
        })
      }
    } catch (err) {
      console.error('Error updating batch statuses:', err)
      setBatchUpdateResult({
        success: false,
        message: err.response?.data?.message || 'Error updating batch statuses'
      })
    } finally {
      setUpdatingBatches(false)
    }
  }

  // Fetch stock data
  const fetchStockData = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      
      // Note: viewStock already refreshes batch statuses server-side,
      // so we don't call updateBatchStatuses() separately here anymore —
      // doing both caused overlapping DB transactions and race-condition failures.
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/staff/viewStock`,
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        const data = response.data.data
        const stockList = data.stockData || []
        const summaryData = data.summary || {}
        
        const processedStock = stockList.map(item => {
          const batches = item.batches || []
          
          const activeBatches = batches.filter(batch => batch.batchStatus !== 'EXPIRED')
          const expiredBatches = batches.filter(batch => batch.batchStatus === 'EXPIRED' && batch.remainingQuantity > 0)
          
          const totalActiveQuantity = activeBatches.reduce((sum, batch) => sum + (batch.remainingQuantity || 0), 0)
          const totalExpiredQuantity = expiredBatches.reduce((sum, batch) => sum + (batch.remainingQuantity || 0), 0)
          const totalCost = activeBatches.reduce((sum, batch) => sum + (batch.totalCost || 0), 0)
          
          const hasActiveBatch = activeBatches.length > 0
          const hasExpiredBatch = expiredBatches.length > 0
          const allExpired = batches.length > 0 && activeBatches.length === 0 && expiredBatches.length > 0
          
          let stockStatus = item.stockStatus || 'In Stock'
          
          if (allExpired) {
            stockStatus = 'Expired'
          } else if (!hasActiveBatch && totalActiveQuantity === 0) {
            stockStatus = 'Out of Stock'
          } else if (totalActiveQuantity <= 5 && totalActiveQuantity > 0) {
            stockStatus = 'Low Stock'
          } else if (totalActiveQuantity > 0) {
            stockStatus = 'In Stock'
          }
          
          return {
            ...item,
            batches: batches,
            activeBatches: activeBatches,
            expiredBatches: expiredBatches,
            totalQuantity: totalActiveQuantity,
            totalExpiredQuantity: totalExpiredQuantity,
            totalCost: totalCost,
            hasActiveBatch: hasActiveBatch,
            hasExpiredBatch: hasExpiredBatch,
            allExpired: allExpired,
            stockStatus: stockStatus,
            // Store original purchase quantity (sum of all batch quantities)
            totalPurchasedQuantity: batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0)
          }
        })
        
        setStockData(processedStock)
        
        const total = processedStock.length
        const inStock = processedStock.filter(item => item.stockStatus === 'In Stock').length
        const lowStock = processedStock.filter(item => item.stockStatus === 'Low Stock').length
        const outOfStock = processedStock.filter(item => item.stockStatus === 'Out of Stock').length
        const expired = processedStock.filter(item => 
          item.expiredBatches && item.expiredBatches.length > 0
        ).length
        
        const totalStockValue = processedStock.reduce((sum, item) => sum + (item.totalCost || 0), 0)
        const totalItems = processedStock.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
        
        setSummary({
          totalIngredients: total,
          inStock,
          lowStock,
          outOfStock,
          expired,
          totalStockValue,
          totalItems
        })
        
        const uniqueCategories = [...new Set(stockList.map(item => item.categoryName))].filter(Boolean)
        const uniqueBrands = [...new Set(stockList.map(item => item.brandName))].filter(Boolean)
        setCategories(uniqueCategories)
        setBrands(uniqueBrands)
      } else {
        setError(response.data.message || 'Failed to fetch stock data')
      }
    } catch (err) {
      console.error('Error fetching stock:', err)
      if (err.response) {
        setError(err.response.data?.message || 'Server error')
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Error fetching stock data')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockData()
  }, [])

  const handleRefresh = async () => {
    await fetchStockData()
  }

  const dismissNotification = () => {
    setBatchUpdateResult(null)
  }

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const hasExpiredBatchWithQuantity = (item) => {
    return item.expiredBatches && item.expiredBatches.length > 0
  }

  const filteredStock = stockData.filter(item => {
    const searchMatch = 
      item.ingredientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit?.toLowerCase().includes(searchTerm.toLowerCase())

    const categoryMatch = filterCategory ? item.categoryName === filterCategory : true
    const brandMatch = filterBrand ? item.brandName === filterBrand : true
    
    let statusMatch = true
    if (filterStatus) {
      if (filterStatus === 'Expired') {
        statusMatch = hasExpiredBatchWithQuantity(item)
      } else {
        statusMatch = item.stockStatus === filterStatus
      }
    }

    return searchMatch && categoryMatch && brandMatch && statusMatch
  })

  const getStatusBg = (status) => {
    const colors = {
      'In Stock': 'bg-green-500/10 border-green-500/30',
      'Low Stock': 'bg-yellow-500/10 border-yellow-500/30',
      'Out of Stock': 'bg-red-500/10 border-red-500/30',
      'Expired': 'bg-gray-500/10 border-gray-500/30'
    }
    return colors[status] || 'bg-gray-500/10 border-gray-500/30'
  }

  const getStatusDot = (status) => {
    const colors = {
      'In Stock': 'bg-green-400',
      'Low Stock': 'bg-yellow-400',
      'Out of Stock': 'bg-red-400',
      'Expired': 'bg-gray-400'
    }
    return colors[status] || 'bg-gray-400'
  }

  const getStatusBorder = (status) => {
    const colors = {
      'In Stock': 'rgba(52, 211, 153, 0.2)',
      'Low Stock': 'rgba(234, 179, 8, 0.2)',
      'Out of Stock': 'rgba(239, 68, 68, 0.2)',
      'Expired': 'rgba(107, 114, 128, 0.2)'
    }
    return colors[status] || 'rgba(255, 255, 255, 0.1)'
  }

  const getStatusGradient = (status) => {
    const colors = {
      'In Stock': 'linear-gradient(to bottom, #34d399, #10b981, #059669)',
      'Low Stock': 'linear-gradient(to bottom, #eab308, #ca8a04, #854d0e)',
      'Out of Stock': 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
      'Expired': 'linear-gradient(to bottom, #6b7280, #4b5563, #374151)'
    }
    return colors[status] || 'linear-gradient(to bottom, #6b7280, #4b5563, #374151)'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

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
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Stock Management
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Monitor your ingredient inventory levels
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || updatingBatches}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[#c9a962]/20 text-[#c9a962] font-bold text-sm rounded-xl hover:bg-[#c9a962]/10 transition-all duration-300 cursor-pointer disabled:opacity-50"
        >
          {(loading || updatingBatches) ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {updatingBatches ? 'Checking Expired...' : loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Batch Update Result Notification */}
      {batchUpdateResult && (
        <div className={`mb-4 p-4 rounded-xl border relative ${
          batchUpdateResult.success 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {batchUpdateResult.success ? '✅' : '❌'}
              <span>{batchUpdateResult.message}</span>
              {batchUpdateResult.success && batchUpdateResult.updatedCount > 0 && (
                <span className="ml-2 text-sm">
                  ({batchUpdateResult.updatedCount} batch{batchUpdateResult.updatedCount > 1 ? 'es' : ''} updated)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={dismissNotification}
              className="text-current hover:opacity-70 transition-opacity duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-20">
            <div 
              className="h-full bg-current opacity-60 rounded-full transition-all duration-[5000ms] ease-linear"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white/5 border border-[#c9a962]/10 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#e8d5a3]">{summary.totalIngredients || 0}</p>
            <p className="text-xs text-[#998f82] mt-1">Total Items</p>
          </div>
          <div className="bg-white/5 border border-green-500/20 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-green-400">{summary.inStock || 0}</p>
            <p className="text-xs text-[#998f82] mt-1">In Stock</p>
          </div>
          <div className="bg-white/5 border border-yellow-500/20 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-yellow-400">{summary.lowStock || 0}</p>
            <p className="text-xs text-[#998f82] mt-1">Low Stock</p>
          </div>
          <div className="bg-white/5 border border-red-500/20 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-red-400">{summary.outOfStock || 0}</p>
            <p className="text-xs text-[#998f82] mt-1">Out of Stock</p>
          </div>
          <div className="bg-white/5 border border-gray-500/20 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-gray-400">{summary.expired || 0}</p>
            <p className="text-xs text-[#998f82] mt-1">Expired Batches</p>
          </div>
          <div className="bg-white/5 border border-[#c9a962]/10 rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#e8d5a3]">{formatCurrency(summary.totalStockValue || 0)}</p>
            <p className="text-xs text-[#998f82] mt-1">Total Value</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, category, brand or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 min-w-[150px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-black">{cat}</option>
          ))}
        </select>

        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 min-w-[150px]"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand} className="bg-black">{brand}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 min-w-[150px]"
        >
          <option value="">All Status</option>
          <option value="In Stock" className="bg-black">In Stock</option>
          <option value="Low Stock" className="bg-black">Low Stock</option>
          <option value="Out of Stock" className="bg-black">Out of Stock</option>
          <option value="Expired" className="bg-black">Expired Batches</option>
        </select>
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
          <span className="ml-3 text-[#998f82]">Loading stock data...</span>
        </div>
      ) : filteredStock.length === 0 ? (
        <div className="text-center py-12 text-[#998f82]">
          {searchTerm || filterCategory || filterBrand || filterStatus 
            ? 'No stock items match your filters' 
            : 'No stock data available'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStock.map((item) => {
            const imageUrl = getImageUrl(item.ingredientImage)
            const hasBatches = item.batches && item.batches.length > 0
            const isExpanded = expandedItems[item._id]
            const hasExpiredBatch = item.expiredBatches && item.expiredBatches.length > 0
            
            return (
              <div
                key={item._id}
                className="group relative bg-white/5 border rounded-xl transition-all duration-300 hover:bg-white/10 w-full overflow-hidden"
                style={{
                  borderColor: getStatusBorder(item.stockStatus)
                }}
              >
                {/* Left Border Accent */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                  style={{
                    background: getStatusGradient(item.stockStatus),
                    opacity: 0.7,
                  }}
                ></div>

                {/* Content */}
                <div className="p-5 pl-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Image - Left Side */}
                    <div className="flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.ingredientName}
                          className="w-16 h-16 rounded-xl object-cover border border-[#c9a962]/20"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `
                              <div class="w-16 h-16 rounded-xl bg-white/5 border border-[#c9a962]/10 flex items-center justify-center text-2xl text-[#8b7355]">
                                🥫
                              </div>
                            `
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-[#c9a962]/10 flex items-center justify-center text-2xl text-[#8b7355]">
                          🥫
                        </div>
                      )}
                    </div>

                    {/* Info - Middle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                          {item.ingredientName}
                        </h3>
                        
                        {/* Status Badge */}
                        <span className={`text-xs font-medium px-3 py-0.5 rounded-full border inline-flex items-center whitespace-nowrap ${getStatusBg(item.stockStatus)}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${getStatusDot(item.stockStatus)}`}></span>
                          {item.stockStatus}
                        </span>
                        
                        {/* Expired Batch Indicator */}
                        {hasExpiredBatch && item.stockStatus !== 'Expired' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/30 inline-flex items-center whitespace-nowrap">
                            ⚠️ {item.expiredBatches.length} Expired Batch{item.expiredBatches.length > 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 min-h-[24px]">
                        {/* Category */}
                        <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                          </svg>
                          <span className="break-words">{item.categoryName}</span>
                        </span>

                        {/* Brand */}
                        <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3.82 10.82a1.72 1.72 0 0 0 0 2.44l7 7a1.72 1.72 0 0 0 2.44 0l7.46-7.46A1.72 1.72 0 0 0 21 11.59V4a2 2 0 0 0-2-2h-7.59a1.72 1.72 0 0 0-1.23.51l-6.35 6.31zM16 8h.01" />
                          </svg>
                          <span className="break-words">{item.brandName}</span>
                        </span>

                        {/* Unit & Quantity - Display with proper formatting */}
                        <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2v4M12 22v-4M4 12H2M22 12h-2M19.07 4.93l-2.83 2.83M6.34 17.66l-2.83 2.83M17.66 17.66l2.83 2.83M4.93 4.93l2.83 2.83" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                          <span className="break-words">
                            Stock: {formatQuantityCompact(item.totalQuantity, item.unit)}
                          </span>
                        </span>

                        {/* Purchased Quantity */}
                        <span className="text-sm text-[#8b7355] flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18M3 15l4-4 4 4 8-8" />
                          </svg>
                          <span className="break-words">
                            Purchased: {formatQuantityCompact(item.totalPurchasedQuantity || 0, item.unit)}
                          </span>
                        </span>

                        {/* Cost Price */}
                        <span className="text-sm text-[#998f82] flex items-center gap-2 group-hover:text-[#c5b7a2] transition-colors duration-300">
                          <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span className="break-words">₹{item.costPrice} / {item.unit}</span>
                        </span>
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-[#8b7355] mt-2">
                        Last Updated: {new Date(item.updatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Right - Total Cost & Expand Button */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-sm text-[#8b7355]">Total Value</p>
                      <p className={`text-lg font-bold ${
                        item.stockStatus === 'Out of Stock' ? 'text-red-400' : 
                        item.stockStatus === 'Low Stock' ? 'text-yellow-400' : 
                        item.stockStatus === 'Expired' ? 'text-red-400' :
                        'text-green-400'
                      }`}>
                        {formatCurrency(item.totalCost)}
                      </p>
                      
                      {hasBatches && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item._id)}
                          className="flex items-center gap-1 text-xs text-[#8b7355] hover:text-[#c5b7a2] transition-colors duration-300"
                        >
                          {isExpanded ? 'Hide Batches' : 'Show Batches'}
                          <svg 
                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Batches Section - Expanded */}
                  {isExpanded && hasBatches && (
                    <div className="mt-4 pt-4 border-t border-[#c9a962]/10">
                      <p className="text-xs font-medium text-[#8b7355] mb-3">Batch Details</p>
                      <div className="space-y-2">
                        {item.batches.map((batch) => {
                          const isExpired = batch.batchStatus === 'EXPIRED'
                          const hasQuantity = batch.remainingQuantity > 0
                          
                          return (
                            <div
                              key={batch.batchNumber}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isExpired 
                                  ? 'bg-red-500/5 border-red-500/20' 
                                  : 'bg-white/5 border-white/10'
                              } ${!hasQuantity ? 'opacity-50' : ''}`}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-white">{batch.batchNumber}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    isExpired 
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  }`}>
                                    {isExpired ? 'Expired' : 'Active'}
                                  </span>
                                  {!hasQuantity && (
                                    <span className="text-xs text-[#8b7355]">(Empty)</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[#8b7355] flex-wrap">
                                  <span>Purchased: {formatQuantityCompact(batch.quantity, item.unit)}</span>
                                  <span>Remaining: {formatQuantityCompact(batch.remainingQuantity || 0, item.unit)}</span>
                                  <span>Unit Cost: ₹{batch.unitCost || 0}</span>
                                  {batch.totalCost && (
                                    <span>Total: ₹{batch.totalCost}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-xs text-[#8b7355]">
                                {batch.expiryDate && (
                                  <div className={`${isExpired ? 'text-red-400' : ''}`}>
                                    {isExpired ? 'Expired: ' : 'Expires: '}
                                    {formatDate(batch.expiryDate)}
                                    {isExpired && hasQuantity && (
                                      <span className="block text-red-400 text-[10px] mt-0.5">
                                        ⚠️ Expired on {formatDate(batch.expiryDate)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {batch.manufacturingDate && (
                                  <div className="text-[10px] text-[#8b7355] mt-0.5">
                                    Mfg: {formatDate(batch.manufacturingDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StaffStock