import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ManagerIngredients = () => {
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState([])
  const [categories, setCategories] = useState({})
  const [brands, setBrands] = useState({})
  const [subcategories, setSubcategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        
        // Fetch categories
        const categoriesRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/manager/viewAllCategory`,
          { headers: { token } }
        )
        const categoriesMap = {}
        if (categoriesRes.data.status === 'SUCCESS') {
          categoriesRes.data.data.forEach(cat => {
            categoriesMap[cat._id] = cat.categoryName
          })
        }
        setCategories(categoriesMap)

        // Fetch brands
        const brandsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/manager/viewAllBrand`,
          { headers: { token } }
        )
        const brandsMap = {}
        if (brandsRes.data.status === 'SUCCESS') {
          brandsRes.data.data.forEach(brand => {
            brandsMap[brand._id] = brand.brandName
          })
        }
        setBrands(brandsMap)

        // Fetch subcategories
        const subcategoriesRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/manager/viewAllSubCategory`,
          { headers: { token } }
        )
        const subcategoriesMap = {}
        if (subcategoriesRes.data.status === 'SUCCESS') {
          subcategoriesRes.data.data.forEach(sub => {
            subcategoriesMap[sub._id] = sub.subCategoryName
          })
        }
        setSubcategories(subcategoriesMap)

        // Fetch ingredients
        const ingredientsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/manager/viewAllIngredient`,
          { headers: { token } }
        )
        if (ingredientsRes.data.status === 'SUCCESS') {
          setIngredients(ingredientsRes.data.data || [])
        } else {
          setError(ingredientsRes.data.message || 'Failed to fetch ingredients')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  // Toggle ingredient status
  const handleToggleStatus = async (id) => {
    setTogglingId(id)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/manager/toggleIngredientStatus/${id}`,
        {},
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        setIngredients(ingredients.map(ingredient => 
          ingredient._id === id ? { ...ingredient, isActive: !ingredient.isActive } : ingredient
        ))
      } else {
        setError(response.data.message || 'Failed to toggle ingredient status')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to toggle status'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Ingredient not found')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to toggle ingredient status. Please try again.')
      }
    } finally {
      setTogglingId(null)
    }
  }

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ingredient => {
    const searchLower = searchTerm.toLowerCase()
    const categoryName = categories[ingredient.categoryId] || ''
    const brandName = brands[ingredient.brandId] || ''
    const subCategoryName = subcategories[ingredient.subCategoryId] || ''
    
    return ingredient.ingredientName?.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower) ||
      brandName.toLowerCase().includes(searchLower) ||
      ingredient.unit?.toLowerCase().includes(searchLower) ||
      subCategoryName.toLowerCase().includes(searchLower)
  })



  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${baseUrl}${imagePath}`
  }

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

  // Get color based on ingredient name
  const getColorByIngredient = (ingredientName) => {
    const colors = ['gold', 'emerald', 'sapphire']
    const hash = ingredientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return themeColors[colors[hash % colors.length]]
  }

  // Get badge color based on category name
  const getBadgeColor = (name) => {
    const colors = [
      'bg-amber-500/15 text-amber-400 border-amber-500/30',
      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'bg-blue-500/15 text-blue-400 border-blue-500/30',
      'bg-purple-500/15 text-purple-400 border-purple-500/30',
      'bg-rose-500/15 text-rose-400 border-rose-500/30',
      'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      'bg-teal-500/15 text-teal-400 border-teal-500/30',
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Unit badge colors
  const unitColors = {
    kg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    g: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ltr: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    ml: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    pcs: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Ingredients
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Manage your inventory ingredients
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
          placeholder="Search ingredients by name, category, brand or unit..."
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
          <span className="ml-3 text-[#998f82]">Loading ingredients...</span>
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="text-center py-12 text-[#998f82]">
          {searchTerm ? 'No ingredients match your search' : 'No ingredients found. Add your first ingredient!'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIngredients.map((ingredient) => {
            const color = getColorByIngredient(ingredient.ingredientName)
            const unitColor = unitColors[ingredient.unit] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
            
            const categoryName = categories[ingredient.categoryId] || 'Unknown'
            const brandName = brands[ingredient.brandId] || 'Unknown'
            const subCategoryName = subcategories[ingredient.subCategoryId] || null

            const categoryBadgeColor = getBadgeColor(categoryName)
            const brandBadgeColor = getBadgeColor(brandName)
            const subBadgeColor = getBadgeColor(subCategoryName || 'default')

            const imageUrl = ingredient.ingredientImage ? getImageUrl(ingredient.ingredientImage) : null

            return (
              <div
                key={ingredient._id}
                className={`group relative bg-white/5 border rounded-xl p-5 transition-all duration-300 hover:bg-white/10 w-full overflow-hidden`}
                style={{
                  borderColor: ingredient.isActive ? color.border : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                {/* Subtle Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none -z-10"
                  style={{
                    background: ingredient.isActive ? `radial-gradient(circle at 30% 50%, ${color.primary}08, transparent 70%)` : 'radial-gradient(circle at 30% 50%, rgba(239, 68, 68, 0.05), transparent 70%)',
                  }}
                ></div>

                {/* Left Border Accent */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                  style={{
                    background: ingredient.isActive 
                      ? `linear-gradient(to bottom, ${color.primary}, ${color.light}, ${color.dark})` 
                      : 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
                    opacity: 0.7,
                  }}
                ></div>

                {/* Content Grid - Image Left, Info Right */}
                <div className="flex flex-col md:flex-row gap-4 pl-4">
                  {/* Left - Image Section */}
                  <div className="flex-shrink-0 self-center md:self-start">
                    {imageUrl ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#c9a962]/75 bg-white/5 shadow-lg shadow-[#c9a962]/10">
                        <img 
                          src={imageUrl}
                          alt={ingredient.ingredientName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = ''
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-[#8b7355] text-3xl bg-gradient-to-br from-[#c9a962]/10 to-transparent">
                                🍽️
                              </div>
                            `
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#c9a962]/20 bg-gradient-to-br from-[#c9a962]/10 to-transparent flex items-center justify-center text-3xl text-[#8b7355]">
                        🍽️
                      </div>
                    )}
                  </div>

                  {/* Right - Ingredient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                        {ingredient.ingredientName}
                      </h3>
                      
                      {/* Unit Badge */}
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${unitColor}`}>
                        {ingredient.unit}
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`text-xs font-medium px-3 py-0.5 rounded-full border transition-all duration-300 inline-flex items-center whitespace-nowrap ${
                        ingredient.isActive 
                          ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
                          ingredient.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {ingredient.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Badge Row */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${categoryBadgeColor}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect width="7" height="9" x="3" y="3" rx="1" />
                          <rect width="7" height="5" x="14" y="3" rx="1" />
                          <rect width="7" height="9" x="14" y="10" rx="1" />
                          <rect width="7" height="5" x="3" y="14" rx="1" />
                        </svg>
                        {categoryName}
                      </span>

                      {/* Subcategory Badge */}
                      {subCategoryName && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${subBadgeColor}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="6" height="6" rx="1" />
                            <rect x="13" y="13" width="8" height="8" rx="1" />
                            <path d="M9 6h4v7" />
                          </svg>
                          {subCategoryName}
                        </span>
                      )}

                      {/* Brand Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${brandBadgeColor}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.82 10.82a1.72 1.72 0 0 0 0 2.44l7 7a1.72 1.72 0 0 0 2.44 0l7.46-7.46A1.72 1.72 0 0 0 21 11.59V4a2 2 0 0 0-2-2h-7.59a1.72 1.72 0 0 0-1.23.51l-6.35 6.31z" />
                          <path d="M16 8h.01" />
                        </svg>
                        {brandName}
                      </span>

                      {/* Cost Price Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#c9a962]/15 text-[#c9a962] border border-[#c9a962]/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ₹{ingredient.costPrice}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-[#8b7355] mt-2">
                      Added: {new Date(ingredient.createdAt).toLocaleDateString('en-IN', {
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
                      onClick={() => handleToggleStatus(ingredient._id)}
                      disabled={togglingId === ingredient._id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                        ingredient.isActive
                          ? `text-[#c9a962] hover:bg-[#c9a962]/10 border border-[#c9a962]/20`
                          : 'text-[#998f82] hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {togglingId === ingredient._id ? (
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="6" />
                          <circle cx={ingredient.isActive ? "16" : "8"} cy="12" r="4" />
                        </svg>
                      )}
                      {ingredient.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditIngredient(ingredient._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#c9a962] hover:bg-[#c9a962]/10 rounded-lg border border-[#c9a962]/20 transition-all duration-300 cursor-pointer flex-shrink-0 whitespace-nowrap"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
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

export default ManagerIngredients