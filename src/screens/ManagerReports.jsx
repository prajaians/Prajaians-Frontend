import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// ============================================
// Quantity formatting
// ============================================

const formatQuantity = (quantity, unit) => {
  if (!quantity || quantity === 0) return `0 ${unit}`
  const num = Number(quantity)

  switch (unit) {
    case 'kg': {
      const kgs = Math.floor(num)
      const grams = Math.round((num - kgs) * 1000)
      if (kgs === 0) return `${grams} g`
      if (grams === 0) return `${kgs} kg`
      return `${kgs} kg ${grams} g`
    }
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

// ============================================
// SVG Icons
// ============================================

const ICON_PATHS = {
  currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-9c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  trendUp: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  bag: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  x: 'M9 9l6 6m0-6l-6 6m11-3a9 9 0 11-18 0 9 9 0 0118 0z',
  layers: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16',
  search: 'M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  chartBar: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm6 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm-6 0a2 2 0 002 2h2M9 19H7m2 0v-6',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  wallet: 'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 100 4 2 2 0 000-4z',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 5.5L18 6l-1.5 2.5L18 11l-2.5-1.5L14 12l1.5-2.5L14 7l2.5 1.5L17 2z',
  lineChart: 'M3 17l4-4 4 4 8-8',
  trendingUp: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
}

const Icon = ({ name, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={ICON_PATHS[name]} />
  </svg>
)

const Spinner = ({ className = 'w-6 h-6' }) => (
  <svg className={`${className} animate-spin text-[#c9a962]`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// ============================================
// Stat Card
// ============================================

const StatCard = ({ icon, label, value, sublabel, tone = 'gold' }) => {
  const toneColors = {
    gold: { text: 'text-[#e8d5a3]', glow: 'bg-[#c9a962]/10', border: 'border-[#c9a962]/30' },
    emerald: { text: 'text-emerald-400', glow: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    yellow: { text: 'text-yellow-400', glow: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    red: { text: 'text-red-400', glow: 'bg-red-500/10', border: 'border-red-500/30' },
    white: { text: 'text-white', glow: 'bg-white/10', border: 'border-white/20' }
  }

  return (
    <div className="group relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-[#c9a962]/15 rounded-2xl p-5 hover:border-[#c9a962]/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#c9a962]/10 overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl transition-all duration-500 group-hover:opacity-80 opacity-0" style={{ background: `radial-gradient(circle, ${toneColors[tone].glow}, transparent 70%)` }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#8b7355] uppercase tracking-[0.15em]">{label}</p>
          <p className={`text-2xl font-bold mt-2 ${toneColors[tone].text}`}>{value}</p>
          {sublabel && <p className="text-[11px] text-[#8b7355]/60 mt-1">{sublabel}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${toneColors[tone].glow} border ${toneColors[tone].border} flex items-center justify-center text-[#c9a962] flex-shrink-0`}>
          <Icon name={icon} className="w-5 h-5" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a962]/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  )
}

// ============================================
// Stock Market Style Graph - Candlestick Chart
// ============================================

const SalesCandlestickChart = ({ sales, formatCurrency }) => {
  const [hoverIdx, setHoverIdx] = useState(null)
  const [grown, setGrown] = useState(false)

  const sorted = useMemo(
    () => [...sales].sort((a, b) => new Date(a.salesDate) - new Date(b.salesDate)),
    [sales]
  )

  useEffect(() => {
    setGrown(false)
    const t = setTimeout(() => setGrown(true), 100)
    return () => clearTimeout(t)
  }, [sorted.length, sorted[0]?._id])

  if (sorted.length === 0) return null

  const maxVal = Math.max(...sorted.map(s => s.totalNetRevenue || 0), 1)
  const chartH = 180
  const padding = 25
  const chartW = Math.max(sorted.length * 28 + padding * 2, 320)

  // Calculate moving average (7-day)
  const movingAvg = sorted.map((_, idx) => {
    const start = Math.max(0, idx - 6)
    const slice = sorted.slice(start, idx + 1)
    const avg = slice.reduce((sum, s) => sum + (s.totalNetRevenue || 0), 0) / slice.length
    return avg
  })

  const getColor = (val, prevVal) => {
    if (prevVal === undefined) return '#c9a962'
    return val >= prevVal ? '#34d399' : '#ef4444'
  }

  const getCandleHeight = (val) => {
    return Math.max((val / maxVal) * chartH * 0.85, 2)
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg width={Math.max(chartW, 300)} height={chartH + 55} className="block">
        <defs>
          <linearGradient id="avgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e8d5a3" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#9a7b4f" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = chartH - f * chartH * 0.85 - 8
          return (
            <line
              key={i}
              x1={padding}
              x2={chartW - padding}
              y1={y}
              y2={y}
              stroke="#c9a962"
              strokeOpacity={0.06}
              strokeDasharray="3 6"
            />
          )
        })}

        {/* Price labels on right */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = chartH - f * chartH * 0.85 - 8
          const val = Math.round(maxVal * (1 - f))
          return (
            <text
              key={i}
              x={chartW - padding + 6}
              y={y + 3}
              fontSize="8"
              fill="#8b7355"
              opacity="0.6"
            >
              {formatCurrency(val)}
            </text>
          )
        })}

        {/* Candlesticks */}
        {sorted.map((sale, idx) => {
          const x = padding + (idx / (sorted.length - 1 || 1)) * (chartW - padding * 2)
          const val = sale.totalNetRevenue || 0
          const height = getCandleHeight(val)
          const y = chartH - height - 8
          const prevVal = idx > 0 ? sorted[idx - 1].totalNetRevenue || 0 : val
          const color = getColor(val, prevVal)
          const isHover = hoverIdx === idx
          const wickColor = color

          const wickHeight = height * 1.15
          const wickY = chartH - wickHeight - 8

          return (
            <g
              key={sale._id}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <line
                x1={x}
                y1={wickY}
                x2={x}
                y2={chartH - 8}
                stroke={wickColor}
                strokeWidth="1.5"
                opacity={grown ? 0.6 : 0}
                style={{ transition: 'opacity 0.5s ease', transitionDelay: `${idx * 15}ms` }}
              />

              <rect
                x={x - 5}
                y={y}
                width={10}
                height={height}
                rx={1.5}
                fill={color}
                opacity={grown ? (isHover ? 1 : 0.85) : 0}
                style={{ transition: 'opacity 0.5s ease, fill 0.2s ease', transitionDelay: `${idx * 15}ms` }}
              />

              {isHover && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={Math.min(Math.max(x - 52, padding + 4), chartW - padding - 104)}
                    y={Math.max(y - 40, 4)}
                    width={104}
                    height={34}
                    rx={8}
                    fill="#120f0c"
                    stroke="#c9a962"
                    strokeOpacity="0.3"
                  />
                  <text
                    x={Math.min(Math.max(x, 52 + padding), chartW - padding - 52)}
                    y={Math.max(y - 40, 4) + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#e8d5a3"
                  >
                    {formatCurrency(val)}
                  </text>
                  <text
                    x={Math.min(Math.max(x, 52 + padding), chartW - padding - 52)}
                    y={Math.max(y - 40, 4) + 26}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#998f82"
                  >
                    {new Date(sale.salesDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Moving Average Line */}
        {sorted.length > 1 && (
          <polyline
            points={sorted.map((sale, idx) => {
              const x = padding + (idx / (sorted.length - 1)) * (chartW - padding * 2)
              const avg = movingAvg[idx] || 0
              const y = chartH - (avg / maxVal) * chartH * 0.85 - 8
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="url(#avgGrad)"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity={grown ? 0.7 : 0}
            style={{ transition: 'opacity 1s ease' }}
          />
        )}
      </svg>
    </div>
  )
}

// ============================================
// Top Products - With Images Fixed
// ============================================

const TopProductsList = ({ products, formatCurrency, getImageUrl, recipeImages }) => {
  const maxRevenue = Math.max(...products.map(p => p.totalRevenue || 0), 1)

  return (
    <div className="space-y-2.5">
      {products.map((product, index) => {
        const pct = Math.round(((product.totalRevenue || 0) / maxRevenue) * 100)
        const medals = [
          { bg: 'bg-[#c9a962]/20', text: 'text-[#e8d5a3]', border: 'border-[#c9a962]/40', icon: 'star' },
          { bg: 'bg-white/10', text: 'text-[#c5b7a2]', border: 'border-white/20', icon: null },
          { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30', icon: null }
        ]
        const medal = medals[index] || { bg: 'bg-white/5', text: 'text-[#8b7355]', border: 'border-white/10', icon: null }
        
        // Get image URL - first from product, then from recipeImages map
        let imageUrl = product.recipeImage || null
        if (!imageUrl && recipeImages) {
          // Find image by recipe name
          const recipeName = product.recipeName
          const recipeImage = recipeImages[recipeName]
          if (recipeImage) {
            imageUrl = recipeImage
          }
        }
        const finalImageUrl = imageUrl ? getImageUrl(imageUrl) : null

        return (
          <div key={index} className="relative bg-white/[0.02] border border-[#c9a962]/10 rounded-xl overflow-hidden group hover:border-[#c9a962]/30 transition-all duration-300">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#c9a962]/10 to-transparent transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${medal.bg} ${medal.text} ${medal.border}`}>
                  {medal.icon ? <Icon name="star" className="w-3.5 h-3.5" /> : `#${index + 1}`}
                </span>
                {/* Product Image - Fixed */}
                {finalImageUrl ? (
                  <img 
                    src={finalImageUrl} 
                    alt={product.recipeName} 
                    className="w-8 h-8 rounded-lg object-cover border border-[#c9a962]/20 flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.parentElement.innerHTML = `
                        <div class="w-8 h-8 rounded-lg bg-white/5 border border-[#c9a962]/10 flex items-center justify-center text-sm text-[#8b7355] flex-shrink-0">🍳</div>
                      `
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-[#c9a962]/10 flex items-center justify-center text-sm text-[#8b7355] flex-shrink-0">🍳</div>
                )}
                <span className="text-sm font-medium text-white truncate">{product.recipeName}</span>
              </div>
              <div className="flex items-center gap-4 text-sm flex-shrink-0">
                <span className="text-[#8b7355]">{product.totalQuantity} sold</span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(product.totalRevenue)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// Stock Level Bar
// ============================================

const StockLevelBar = ({ remaining, purchased, status }) => {
  const pct = purchased > 0 ? Math.min(100, Math.round((remaining / purchased) * 100)) : 0
  const barColors = {
    'In Stock': 'from-emerald-400/80 to-emerald-500',
    'Low Stock': 'from-yellow-400/80 to-yellow-500',
    'Out of Stock': 'from-red-400/80 to-red-500'
  }
  const barColor = barColors[status] || 'from-[#c9a962]/60 to-[#c9a962]'

  return (
    <div className="relative">
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`} 
          style={{ width: `${pct}%` }}
        />
      </div>
      <div 
        className="absolute -top-1 w-3 h-3 rounded-full bg-[#c9a962]/20 blur-sm transition-all duration-1000"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  )
}

// ============================================
// Main Component
// ============================================

const ManagerReports = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sales')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const [salesSummary, setSalesSummary] = useState(null)
  const [monthlySales, setMonthlySales] = useState([])
  const [stockData, setStockData] = useState([])
  const [stockSummary, setStockSummary] = useState(null)
  const [expiringItems, setExpiringItems] = useState([])
  const [expiredItems, setExpiredItems] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [recipeImages, setRecipeImages] = useState({})

  // Stock filters
  const [stockSearchTerm, setStockSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${baseUrl}${imagePath}`
  }

  useEffect(() => {
    if (!selectedMonth) setSelectedMonth('all')
    if (!selectedYear) setSelectedYear(String(currentYear))
  }, [])

  // Fetch total recipes and their images
  const fetchRecipeData = async () => {
    setRecipesLoading(true)
    try {
      const token = localStorage.getItem('token')
      let recipesData = []
      
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllRecipe`,
          { headers: { token } }
        )
        if (response.data.status === 'SUCCESS') {
          recipesData = response.data.data || []
        }
      } catch (staffErr) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/manager/viewAllRecipe`,
            { headers: { token } }
          )
          if (response.data.status === 'SUCCESS') {
            recipesData = response.data.data || []
          }
        } catch (managerErr) {
          console.error('Error fetching recipes:', managerErr)
        }
      }
      
      setTotalRecipes(recipesData.length)
      
      // Build recipe images map for top products
      const imagesMap = {}
      recipesData.forEach(recipe => {
        if (recipe.recipeName && recipe.recipeImage) {
          imagesMap[recipe.recipeName] = recipe.recipeImage
        }
      })
      setRecipeImages(imagesMap)
      
    } catch (err) {
      console.error('Error fetching recipe data:', err)
      setTotalRecipes(0)
    } finally {
      setRecipesLoading(false)
    }
  }

  const fetchSalesSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sales/summary`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setSalesSummary(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching sales summary:', err)
    }
  }

  const fetchMonthlySales = async (month, year) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let fromStr, toStr

      if (month === 'all') {
        fromStr = `${year}-01-01`
        toStr = `${year}-12-31`
      } else {
        const fromDate = new Date(year, parseInt(month), 1)
        const toDate = new Date(year, parseInt(month) + 1, 0)
        fromStr = fromDate.toISOString().split('T')[0]
        toStr = toDate.toISOString().split('T')[0]
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/sales/date-range?fromDate=${fromStr}&toDate=${toStr}`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setMonthlySales(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching monthly sales:', err)
      setError('Failed to fetch monthly sales data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStockData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manager/viewStock`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        const data = response.data.data
        const stockList = data.stockData || []

        const processedStock = stockList.map(item => {
          const batches = item.batches || []
          const activeBatches = batches.filter(b => b.batchStatus !== 'EXPIRED')
          const expiredBatches = batches.filter(b => b.batchStatus === 'EXPIRED' && b.remainingQuantity > 0)

          const totalRemaining = activeBatches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0)
          const totalPurchased = batches.reduce((sum, b) => sum + (b.quantity || 0), 0)
          const totalCost = activeBatches.reduce((sum, b) => sum + (b.totalCost || 0), 0)

          let stockStatus = 'In Stock'
          if (totalRemaining <= 0) stockStatus = 'Out of Stock'
          else if (totalRemaining <= 5) stockStatus = 'Low Stock'

          return {
            ...item,
            totalRemaining,
            totalPurchased,
            totalCost,
            activeBatches,
            expiredBatches,
            stockStatus
          }
        })

        setStockData(processedStock)

        const uniqueCategories = [...new Set(stockList.map(item => item.categoryName).filter(Boolean))]
        const uniqueBrands = [...new Set(stockList.map(item => item.brandName).filter(Boolean))]
        setCategories(uniqueCategories)
        setBrands(uniqueBrands)

        const totalIngredients = processedStock.length
        const inStock = processedStock.filter(item => item.stockStatus === 'In Stock').length
        const lowStock = processedStock.filter(item => item.stockStatus === 'Low Stock').length
        const outOfStock = processedStock.filter(item => item.stockStatus === 'Out of Stock').length

        const today = new Date()
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        const expiring = processedStock.filter(item => {
          return item.activeBatches?.some(batch => {
            const expiryDate = new Date(batch.expiryDate)
            return expiryDate > today && expiryDate <= thirtyDaysFromNow && batch.remainingQuantity > 0
          })
        })

        const expired = processedStock.filter(item => {
          return item.expiredBatches?.length > 0
        })

        setExpiringItems(expiring)
        setExpiredItems(expired)
        setStockSummary({
          totalIngredients,
          inStock,
          lowStock,
          outOfStock,
          expiringCount: expiring.length,
          expiredCount: expired.length,
          totalStockValue: processedStock.reduce((sum, item) => sum + (item.totalCost || 0), 0),
          totalItems: processedStock.reduce((sum, item) => sum + (item.totalRemaining || 0), 0)
        })
      }
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError('Failed to fetch stock data')
    }
  }

  useEffect(() => {
    fetchSalesSummary()
    fetchStockData()
    fetchRecipeData()
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchMonthlySales(selectedMonth, parseInt(selectedYear))
    }
  }, [selectedMonth, selectedYear])

  const handleRefresh = async () => {
    setRefreshing(true)
    setError('')
    await Promise.all([
      fetchSalesSummary(),
      fetchMonthlySales(selectedMonth, parseInt(selectedYear)),
      fetchStockData(),
      fetchRecipeData()
    ])
    setLastUpdated(new Date())
    setRefreshing(false)
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

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const getYearOptions = () => {
    const years = []
    for (let i = currentYear; i >= currentYear - 4; i--) {
      years.push(i)
    }
    return years
  }

  const filteredStock = stockData.filter(item => {
    const searchMatch =
      item.ingredientName?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      item.categoryName?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      item.brandName?.toLowerCase().includes(stockSearchTerm.toLowerCase())

    const categoryMatch = filterCategory ? item.categoryName === filterCategory : true
    const brandMatch = filterBrand ? item.brandName === filterBrand : true
    const statusMatch = filterStatus ? item.stockStatus === filterStatus : true

    return searchMatch && categoryMatch && brandMatch && statusMatch
  })

  const monthlyTotals = useMemo(() => monthlySales.reduce((acc, sale) => {
    acc.revenue += sale.totalNetRevenue || 0
    acc.profit += sale.totalProfit || 0
    acc.items += sale.totalItems || 0
    acc.count += 1
    return acc
  }, { revenue: 0, profit: 0, items: 0, count: 0 }), [monthlySales])

  return (
    <div className="relative space-y-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-20 right-10 w-96 h-96 bg-[#c9a962]/[0.04] rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a962]/20 to-[#9a7b4f]/20 border border-[#c9a962]/30 flex items-center justify-center">
              <Icon name="sparkles" className="w-5 h-5 text-[#c9a962]" />
            </div>
            <div>
              <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold tracking-tight">
                Analytics Dashboard
              </h2>
              <p className="text-sm text-[#8b7355] mt-0.5">Sales performance & inventory intelligence</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-[#8b7355] hidden sm:inline font-mono">
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[#c9a962]/20 text-[#c9a962] text-sm font-medium rounded-xl hover:bg-[#c9a962]/10 hover:border-[#c9a962]/40 transition-all duration-300 disabled:opacity-60"
          >
            <Icon name="refresh" className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-white/[0.02] border border-[#c9a962]/15 rounded-xl w-fit">
        {[
          { id: 'sales', label: 'Sales Analytics', icon: 'chartBar' },
          { id: 'stock', label: 'Stock Insights', icon: 'box' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] shadow-lg shadow-[#c9a962]/25'
                : 'text-[#998f82] hover:text-[#c5b7a2] hover:bg-white/5'
            }`}
          >
            <Icon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2.5">
          <Icon name="alert" className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ==================== SALES TAB ==================== */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          {/* KPI Cards */}
          {salesSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StatCard
                icon="currency"
                tone="emerald"
                label="Today's Revenue"
                value={formatCurrency(salesSummary.today?.revenue || 0)}
                sublabel={`Profit ${formatCurrency(salesSummary.today?.profit || 0)}`}
              />
              <StatCard
                icon="calendar"
                tone="gold"
                label="This Week"
                value={formatCurrency(salesSummary.week?.revenue || 0)}
                sublabel={`Profit ${formatCurrency(salesSummary.week?.profit || 0)}`}
              />
              <StatCard
                icon="trendUp"
                tone="white"
                label="This Month"
                value={formatCurrency(salesSummary.month?.revenue || 0)}
                sublabel={`Profit ${formatCurrency(salesSummary.month?.profit || 0)}`}
              />
              <StatCard
                icon="bag"
                tone="white"
                label="Items Sold"
                value={salesSummary.today?.items || 0}
                sublabel="Today"
              />

            </div>
          )}

          {/* Monthly Report - Stock Market Style */}
          <div className="bg-white/[0.02] border border-[#c9a962]/15 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/20 flex items-center justify-center text-[#c9a962]">
                  <Icon name="lineChart" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">Market Performance</h3>
                  <p className="text-xs text-[#8b7355]">Daily revenue with moving average</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] cursor-pointer"
                >
                  <option value="all" className="bg-black">All Months</option>
                  {monthNames.map((name, index) => (
                    <option key={index} value={index} className="bg-black">{name}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] cursor-pointer"
                >
                  {getYearOptions().map((year) => (
                    <option key={year} value={year} className="bg-black">{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
                <span className="ml-3 text-[#998f82] text-sm">Loading...</span>
              </div>
            ) : monthlySales.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#c9a962]/15 rounded-xl">
                <Icon name="chartBar" className="w-8 h-8 text-[#8b7355]/40 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">No sales recorded</p>
                <p className="text-xs text-[#8b7355] mt-1">
                  {selectedMonth === 'all' ? `for ${selectedYear}` : `${monthNames[parseInt(selectedMonth)]} ${selectedYear}`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary chips */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-bold text-white">{monthlyTotals.count}</p>
                    <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Sales</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(monthlyTotals.revenue)}</p>
                    <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Revenue</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-bold text-[#c9a962]">{formatCurrency(monthlyTotals.profit)}</p>
                    <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Profit</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 text-center">
                    <p className="text-sm font-bold text-white">{monthlyTotals.items}</p>
                    <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Items</p>
                  </div>
                </div>

                {/* Stock Market Style Chart */}
                <div className="bg-black/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-[#8b7355] uppercase tracking-wider">Net Revenue</span>
                    <span className="text-[9px] text-[#8b7355]">Hover for details • — Moving Avg</span>
                  </div>
                  <SalesCandlestickChart sales={monthlySales} formatCurrency={formatCurrency} />
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/20 border-b border-[#c9a962]/10">
                        <th className="text-left text-[10px] font-semibold text-[#8b7355] py-2.5 px-3 uppercase tracking-wider">Date</th>
                        <th className="text-left text-[10px] font-semibold text-[#8b7355] py-2.5 px-3 uppercase tracking-wider">ID</th>
                        <th className="text-right text-[10px] font-semibold text-[#8b7355] py-2.5 px-3 uppercase tracking-wider">Items</th>
                        <th className="text-right text-[10px] font-semibold text-[#8b7355] py-2.5 px-3 uppercase tracking-wider">Revenue</th>
                        <th className="text-right text-[10px] font-semibold text-[#8b7355] py-2.5 px-3 uppercase tracking-wider">Profit</th>
                        <th className="text-center text-[10px] font-semibold text-[#8b7355] py-2.5 px-3 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlySales.map((sale, i) => (
                        <tr
                          key={sale._id}
                          className={`border-b border-white/5 hover:bg-white/[0.04] transition-colors ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                        >
                          <td className="py-2.5 px-3 text-xs text-[#c5b7a2]">{formatDate(sale.salesDate)}</td>
                          <td className="py-2.5 px-3 text-xs text-white font-mono">#{sale._id?.slice(-8) || 'N/A'}</td>
                          <td className="py-2.5 px-3 text-xs text-[#998f82] text-right">{sale.totalItems || 0}</td>
                          <td className="py-2.5 px-3 text-xs text-emerald-400 text-right font-medium">{formatCurrency(sale.totalNetRevenue || 0)}</td>
                          <td className={`py-2.5 px-3 text-xs font-medium text-right ${(sale.totalProfit || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(sale.totalProfit || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              sale.totalProfit > 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}>
                              {sale.totalProfit > 0 ? '▲' : '▼'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Top Products with Images - Fixed */}
          {salesSummary?.topProducts && salesSummary.topProducts.length > 0 && (
            <div className="bg-white/[0.02] border border-[#c9a962]/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#c9a962]/10 border border-[#c9a962]/20 flex items-center justify-center text-[#c9a962]">
                  <Icon name="star" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">Top Selling Products</h3>
                  <p className="text-xs text-[#8b7355]">Best performers by revenue</p>
                </div>
              </div>
              <TopProductsList 
                products={salesSummary.topProducts} 
                formatCurrency={formatCurrency} 
                getImageUrl={getImageUrl}
                recipeImages={recipeImages}
              />
            </div>
          )}
        </div>
      )}

      {/* ==================== STOCK TAB ==================== */}
      {activeTab === 'stock' && (
        <div className="space-y-5">
          {/* Stock KPI Cards */}
          {stockSummary && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard icon="box" tone="gold" label="Total Items" value={stockSummary.totalIngredients || 0} />
                <StatCard icon="check" tone="emerald" label="In Stock" value={stockSummary.inStock || 0} />
                <StatCard icon="alert" tone="yellow" label="Low Stock" value={stockSummary.lowStock || 0} />
                <StatCard icon="x" tone="red" label="Out of Stock" value={stockSummary.outOfStock || 0} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard icon="wallet" tone="gold" label="Stock Value" value={formatCurrency(stockSummary.totalStockValue || 0)} />
                <StatCard icon="clock" tone="yellow" label="Expiring Soon" value={stockSummary.expiringCount || 0} sublabel="Within 30 days" />
                <StatCard icon="trash" tone="red" label="Expired" value={stockSummary.expiredCount || 0} sublabel="Need disposal" />
                <StatCard icon="layers" tone="white" label="Total Recipes" value={recipesLoading ? '...' : totalRecipes} sublabel="Active menu items" />
              </div>
            </>
          )}

          {/* Filters */}
          <div className="bg-white/[0.02] border border-[#c9a962]/15 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Icon name="search" className="w-4 h-4 text-[#8b7355] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stockSearchTerm}
                onChange={(e) => setStockSearchTerm(e.target.value)}
                placeholder="Search by ingredient, category, or brand..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 text-sm focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] cursor-pointer"
              >
                <option value="" className='bg-black/50'>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-black">{cat}</option>
                ))}
              </select>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] cursor-pointer"
              >
                <option value="" className='bg-black/50'>All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand} className="bg-black">{brand}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] cursor-pointer"
              >
                <option value="" className='bg-black/50'>All Status</option>
                <option value="In Stock" className="bg-black">In Stock</option>
                <option value="Low Stock" className="bg-black">Low Stock</option>
                <option value="Out of Stock" className="bg-black">Out of Stock</option>
              </select>
              {(stockSearchTerm || filterCategory || filterBrand || filterStatus) && (
                <button
                  type="button"
                  onClick={() => {
                    setStockSearchTerm('')
                    setFilterCategory('')
                    setFilterBrand('')
                    setFilterStatus('')
                  }}
                  className="text-xs text-[#8b7355] hover:text-white px-2 py-1.5 transition-colors"
                >
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-[#8b7355]">
                {filteredStock.length} items
              </span>
            </div>
          </div>

          {/* Stock List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
              <span className="ml-3 text-[#998f82]">Loading...</span>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-dashed border-[#c9a962]/15 rounded-2xl">
              <Icon name="box" className="w-8 h-8 text-[#8b7355]/40 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">No stock items found</p>
              <p className="text-xs text-[#8b7355] mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStock.map((item) => {
                const imageUrl = getImageUrl(item.ingredientImage)
                const isExpiring = expiringItems.some(e => e._id === item._id)
                const isExpired = expiredItems.some(e => e._id === item._id)
                const hasBatches = item.activeBatches && item.activeBatches.length > 0

                return (
                  <div
                    key={item._id}
                    className={`group bg-white/[0.02] border rounded-xl p-4 transition-all duration-300 hover:bg-white/[0.04] ${
                      isExpired ? 'border-red-500/20 hover:border-red-500/40' :
                      isExpiring ? 'border-yellow-500/20 hover:border-yellow-500/40' :
                      'border-[#c9a962]/15 hover:border-[#c9a962]/30'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Image + Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.ingredientName}
                            className="w-14 h-14 rounded-xl object-cover border border-[#c9a962]/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-white/5 border border-[#c9a962]/10 flex items-center justify-center text-2xl text-[#8b7355] flex-shrink-0">
                            🥫
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-['Playfair_Display',serif] text-white font-semibold truncate">
                              {item.ingredientName}
                            </h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              item.stockStatus === 'In Stock' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                              item.stockStatus === 'Low Stock' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}>
                              {item.stockStatus}
                            </span>
                            {isExpiring && !isExpired && (
                              <span className="text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                                Expiring soon
                              </span>
                            )}
                            {isExpired && (
                              <span className="text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                                Expired
                              </span>
                            )}
                          </div>

                          {/* Details grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 mt-2">
                            <div>
                              <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Category</p>
                              <p className="text-xs text-[#c5b7a2] truncate">{item.categoryName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Brand</p>
                              <p className="text-xs text-[#c5b7a2] truncate">{item.brandName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Cost / Unit</p>
                              <p className="text-xs text-[#c9a962]">₹{item.costPrice} / {item.unit}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Stock Value</p>
                              <p className="text-xs text-[#c9a962] font-medium">{formatCurrency(item.totalCost || 0)}</p>
                            </div>
                          </div>

                          {/* Stock bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#8b7355]">
                                Remaining <span className="text-white font-medium">{formatQuantity(item.totalRemaining || 0, item.unit)}</span>
                              </span>
                              <span className="text-[#8b7355] text-[10px]">of {formatQuantity(item.totalPurchased || 0, item.unit)}</span>
                            </div>
                            <StockLevelBar remaining={item.totalRemaining} purchased={item.totalPurchased} status={item.stockStatus} />
                          </div>
                        </div>
                      </div>

                      {/* Batches */}
                      {hasBatches && (
                        <div className="lg:w-48 flex-shrink-0 bg-black/20 rounded-xl p-3 space-y-2">
                          <p className="text-[9px] text-[#8b7355] uppercase tracking-wider">Active Batches</p>
                          {item.activeBatches?.slice(0, 2).map((batch, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[#c5b7a2] truncate text-[10px]">{batch.batchNumber}</span>
                                <span className="text-[#c9a962] flex-shrink-0 font-medium text-[10px]">{formatQuantityCompact(batch.remainingQuantity || 0, item.unit)}</span>
                              </div>
                              {batch.expiryDate && (
                                <p className={`text-[9px] mt-0.5 ${new Date(batch.expiryDate) < new Date() ? 'text-red-400' : 'text-[#8b7355]'}`}>
                                  {new Date(batch.expiryDate) < new Date() ? 'Expired' : 'Expires'} {formatDate(batch.expiryDate)}
                                </p>
                              )}
                            </div>
                          ))}
                          {item.activeBatches?.length > 2 && (
                            <p className="text-[9px] text-[#8b7355] pt-0.5">+{item.activeBatches.length - 2} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ManagerReports