import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const StaffRecipes = () => {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSubCategory, setFilterSubCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [ingredients, setIngredients] = useState([])

  // Fetch recipes
  const fetchRecipes = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/staff/viewAllRecipe`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setRecipes(response.data.data || [])
      } else {
        setError(response.data.message || 'Failed to fetch recipes')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching recipes')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/staff/viewAllCategory`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setCategories(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  // Fetch subcategories for filter
  const fetchSubcategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/staff/viewAllSubCategory`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setSubcategories(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching subcategories:', err)
    }
  }

  // Fetch ingredients to get category/subcategory info
  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/staff/viewAllIngredient`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setIngredients(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err)
    }
  }

  useEffect(() => {
    fetchRecipes()
    fetchCategories()
    fetchSubcategories()
    fetchIngredients()
  }, [])

  // Toggle recipe status
  const handleToggleStatus = async (id) => {
    setTogglingId(id)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/staff/toggleRecipeStatus/${id}`,
        {},
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        setRecipes(recipes.map(recipe => 
          recipe._id === id ? { ...recipe, isActive: !recipe.isActive } : recipe
        ))
      } else {
        setError(response.data.message || 'Failed to toggle recipe status')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to toggle status'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Recipe not found')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to toggle recipe status. Please try again.')
      }
    } finally {
      setTogglingId(null)
    }
  }

  // Get all category IDs from a recipe's ingredients
  const getRecipeCategoryIds = (recipeItems) => {
    const categoryIds = new Set()
    if (!recipeItems || !ingredients.length) return categoryIds
    
    recipeItems.forEach(item => {
      const ingredient = ingredients.find(ing => ing._id === item.ingredientId)
      if (ingredient && ingredient.categoryId) {
        const categoryId = typeof ingredient.categoryId === 'object' 
          ? ingredient.categoryId._id 
          : ingredient.categoryId
        categoryIds.add(categoryId)
      }
    })
    return categoryIds
  }

  // Get all subcategory IDs from a recipe's ingredients
  const getRecipeSubCategoryIds = (recipeItems) => {
    const subCategoryIds = new Set()
    if (!recipeItems || !ingredients.length) return subCategoryIds
    
    recipeItems.forEach(item => {
      const ingredient = ingredients.find(ing => ing._id === item.ingredientId)
      if (ingredient && ingredient.subCategoryId) {
        const subCategoryId = typeof ingredient.subCategoryId === 'object'
          ? ingredient.subCategoryId._id
          : ingredient.subCategoryId
        if (subCategoryId) {
          subCategoryIds.add(subCategoryId)
        }
      }
    })
    return subCategoryIds
  }

  // Check if recipe matches category filter
  const matchesCategory = (recipe) => {
    if (!filterCategory) return true
    const categoryIds = getRecipeCategoryIds(recipe.recipeItems)
    return categoryIds.has(filterCategory)
  }

  // Check if recipe matches subcategory filter
  const matchesSubCategory = (recipe) => {
    if (!filterSubCategory) return true
    const subCategoryIds = getRecipeSubCategoryIds(recipe.recipeItems)
    return subCategoryIds.has(filterSubCategory)
  }

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.recipeName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = matchesCategory(recipe)
    const matchesSub = matchesSubCategory(recipe)
    return matchesSearch && matchesCat && matchesSub
  })

  // Navigate to Add Recipe
  const handleAddRecipe = () => {
    navigate('/staffPanel/recipes/add')
  }

  // Navigate to Edit Recipe
  const handleEditRecipe = (id) => {
    navigate(`/staffPanel/recipes/edit/${id}`)
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
       return imagePath

  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterSubCategory('')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Recipes
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Manage your menu recipes
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRecipe}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Recipe
        </button>
      </div>

      {/* Search and Filter Card */}
      <div className="bg-white/5 border border-[#c9a962]/15 rounded-xl p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
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
              placeholder="Search recipes by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
            />
          </div>

          {/* Category Filter */}
          <div className="relative md:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 appearance-none"
            >
              <option value="" className="bg-black/80">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id} className="bg-black">
                  {cat.categoryName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* SubCategory Filter */}
          <div className="relative md:w-48">
            <select
              value={filterSubCategory}
              onChange={(e) => setFilterSubCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 appearance-none"
            >
              <option value="" className="bg-black/80">All Subcategories</option>
              {subcategories.map((sub) => (
                <option key={sub._id} value={sub._id} className="bg-black">
                  {sub.subCategoryName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || filterCategory || filterSubCategory) && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#998f82] hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
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
          {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
        </p>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-[#998f82]">Loading recipes...</span>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-12 text-[#998f82] bg-white/5 border border-[#c9a962]/10 rounded-xl">
          <div className="text-5xl mb-4">🍳</div>
          <p className="text-lg font-medium text-white">No recipes found</p>
          <p className="text-sm mt-1">
            {searchTerm || filterCategory || filterSubCategory 
              ? 'Try adjusting your search or filters' 
              : 'Create your first recipe to get started'}
          </p>
          {(searchTerm || filterCategory || filterSubCategory) && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-[#c9a962]/20 text-[#c9a962] rounded-lg hover:bg-[#c9a962]/30 transition-all duration-300"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => {
            const imageUrl = recipe.recipeImage ? getImageUrl(recipe.recipeImage) : null

            return (
              <div
                key={recipe._id}
                className={`group relative bg-white/5 border rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#c9a962]/10 ${
                  recipe.isActive 
                    ? 'border-[#c9a962]/20 hover:border-[#c9a962]/40' 
                    : 'border-red-500/20 hover:border-red-500/40'
                }`}
              >
                {/* Status Badge - Top Right */}
                <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 inline-flex items-center whitespace-nowrap ${
                  recipe.isActive 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
                    recipe.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}></span>
                  {recipe.isActive ? 'Active' : 'Inactive'}
                </div>

                {/* Recipe Image */}
                <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-[#c9a962]/5 to-transparent relative">
                  {imageUrl ? (
                    <img 
                      src={imageUrl}
                      alt={recipe.recipeName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = ''
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-[#8b7355] text-6xl bg-gradient-to-br from-[#c9a962]/10 to-transparent">
                            🍳
                          </div>
                        `
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-[#8b7355] bg-gradient-to-br from-[#c9a962]/10 to-transparent">
                      🍳
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0805]/80 via-transparent to-transparent"></div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold truncate">
                    {recipe.recipeName}
                  </h3>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8b7355]">Cost:</span>
                      <span className="text-sm font-bold text-[#c9a962]">₹{recipe.recipeCost}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8b7355]">Selling:</span>
                      <span className="text-sm font-bold text-emerald-400">₹{recipe.sellingPrice}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {recipe.profitPercentage}% Profit
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {recipe.recipeItems?.length || 0} items
                    </span>
                  </div>

                  <p className="text-[10px] text-[#8b7355] mt-2">
                    Added: {new Date(recipe.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#c9a962]/10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(recipe._id)}
                      disabled={togglingId === recipe._id}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                        recipe.isActive
                          ? 'text-[#c9a962] hover:bg-[#c9a962]/10 border border-[#c9a962]/20'
                          : 'text-[#998f82] hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {togglingId === recipe._id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="6" width="20" height="12" rx="6" />
                          <circle cx={recipe.isActive ? "16" : "8"} cy="12" r="4" />
                        </svg>
                      )}
                      {recipe.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditRecipe(recipe._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#c9a962] hover:bg-[#c9a962]/10 rounded-lg border border-[#c9a962]/20 transition-all duration-300 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default StaffRecipes