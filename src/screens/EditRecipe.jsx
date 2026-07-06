import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const EditRecipe = ({ id: propId }) => {
  const navigate = useNavigate()
  const params = useParams()
  const id = propId || params.id
  
  const [ingredients, setIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const [fetching, setFetching] = useState(true)
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  const [formData, setFormData] = useState({
    recipeName: '',
    recipeItems: [],
    recipeCost: 0,
    profitPercentage: '',
    sellingPrice: 0
  })
  
  const [currentIngredient, setCurrentIngredient] = useState({
    ingredientId: '',
    quantity: '',
    unit: 'g'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [currentImage, setCurrentImage] = useState('')

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${baseUrl}${imagePath}`
  }

  // Helper: Convert to base unit for storage (g, ml, or pcs)
  const convertToBaseUnit = (quantity, unit, ingredientUnit) => {
    if (ingredientUnit === 'pcs') {
      return quantity
    }
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') {
      if (unit === 'kg') return quantity * 1000
      if (unit === 'g') return quantity
      if (unit === 'mg') return quantity / 1000
      return quantity
    }
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') {
      if (unit === 'ltr') return quantity * 1000
      if (unit === 'ml') return quantity
      return quantity
    }
    return quantity
  }

  // Helper: Calculate cost for a single ingredient
  const calculateIngredientCost = (quantity, ingredientUnit, costPrice) => {
    if (ingredientUnit === 'pcs') {
      return costPrice * quantity
    }
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') {
      const quantityInKg = quantity / 1000
      return costPrice * quantityInKg
    }
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') {
      const quantityInL = quantity / 1000
      return costPrice * quantityInL
    }
    return 0
  }

  // Helper: Format quantity for display
  const formatDisplayQuantity = (quantity, unit, ingredientUnit) => {
    if (ingredientUnit === 'pcs') {
      return `${quantity} pcs`
    }
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') {
      if (unit === 'kg') return `${quantity}kg`
      if (unit === 'g') return `${quantity}g`
      if (unit === 'mg') return `${quantity}mg`
      return `${quantity}g`
    }
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') {
      if (unit === 'ltr') return `${quantity}L`
      if (unit === 'ml') return `${quantity}ml`
      return `${quantity}ml`
    }
    return `${quantity} ${unit}`
  }

  // The fixed base unit that a recipe item's stored `quantity` is always
  // normalized to, based on the ingredient's category - "g" for weight
  // ingredients (kg/g/mg), "ml" for volume ingredients (ltr/ml), "pcs" for
  // count ingredients. This is what actually gets persisted to the backend
  // alongside quantity, so stock deduction can convert correctly later.
  const getBaseUnit = (ingredientUnit) => {
    if (ingredientUnit === 'pcs') return 'pcs'
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') return 'g'
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') return 'ml'
    return ingredientUnit
  }

  // Get available units based on ingredient's unit
  const getAvailableUnits = (ingredientUnit) => {
    if (ingredientUnit === 'pcs') {
      return [{ value: 'pcs', label: 'Pieces' }]
    }
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') {
      return [
        { value: 'kg', label: 'Kilogram (kg)' },
        { value: 'g', label: 'Gram (g)' },
        { value: 'mg', label: 'Milligram (mg)' }
      ]
    }
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') {
      return [
        { value: 'ltr', label: 'Litre (L)' },
        { value: 'ml', label: 'Millilitre (ml)' }
      ]
    }
    return [{ value: ingredientUnit, label: ingredientUnit }]
  }

  // Find the best display unit for an ingredient quantity
  const getBestDisplayUnit = (quantity, ingredientUnit) => {
    if (ingredientUnit === 'pcs') return 'pcs'
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') {
      if (quantity >= 1000) return 'kg'
      if (quantity >= 1) return 'g'
      return 'mg'
    }
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') {
      if (quantity >= 1000) return 'ltr'
      return 'ml'
    }
    return ingredientUnit
  }

  // Get display value for edit
  const getDisplayValue = (quantity, ingredientUnit) => {
    if (ingredientUnit === 'pcs') return quantity
    if (ingredientUnit === 'kg' || ingredientUnit === 'g') {
      if (quantity >= 1000) return quantity / 1000
      if (quantity >= 1) return quantity
      return quantity * 1000
    }
    if (ingredientUnit === 'ltr' || ingredientUnit === 'ml') {
      if (quantity >= 1000) return quantity / 1000
      return quantity
    }
    return quantity
  }

  // Calculate recipe cost - ROUND TO NEAREST INTEGER
  const calculateRecipeCost = () => {
    let totalCost = 0
    formData.recipeItems.forEach(item => {
      const ingredient = ingredients.find(ing => ing._id === item.ingredientId)
      if (ingredient) {
        const cost = calculateIngredientCost(item.quantity, ingredient.unit, ingredient.costPrice)
        totalCost += cost
      }
    })
    setFormData(prev => ({ ...prev, recipeCost: Math.round(totalCost) }))
  }

  // Calculate selling price - ROUND TO NEAREST INTEGER
  const calculateSellingPrice = () => {
    const cost = formData.recipeCost
    const profit = parseFloat(formData.profitPercentage) || 0
    if (cost > 0 && profit > 0) {
      const sellingPrice = cost + (cost * profit / 100)
      // Ensure selling price is at least cost + 1
      const roundedPrice = Math.round(sellingPrice)
      setFormData(prev => ({ 
        ...prev, 
        sellingPrice: roundedPrice <= cost ? cost + 1 : roundedPrice 
      }))
    } else {
      setFormData(prev => ({ ...prev, sellingPrice: cost }))
    }
  }

  // Fetch ingredients and recipe data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Recipe ID is missing')
        setFetching(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        
        // Fetch ingredients
        const ingredientsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllIngredient`,
          { headers: { token } }
        )
        if (ingredientsRes.data.status === 'SUCCESS') {
          const activeIngredients = ingredientsRes.data.data.filter(ing => ing.isActive === true)
          setIngredients(activeIngredients)
          setFilteredIngredients(activeIngredients)
        }

        // Fetch recipe to edit
        const recipeRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllRecipe`,
          { headers: { token } }
        )
        
        if (recipeRes.data.status === 'SUCCESS') {
          const recipe = recipeRes.data.data.find(r => r._id === id)
          if (recipe) {
            // Get ingredient details for each recipe item
            const recipeItemsWithDetails = recipe.recipeItems.map(item => {
              const ingredient = ingredientsRes.data.data.find(ing => ing._id === item.ingredientId)
              const quantity = item.quantity || 0
              const ingredientUnit = ingredient?.unit || 'g'
              const costPrice = ingredient?.costPrice || 0
              
              // Calculate cost
              const cost = calculateIngredientCost(quantity, ingredientUnit, costPrice)
              
              // Find best display unit
              const displayUnit = getBestDisplayUnit(quantity, ingredientUnit)
              const displayValue = getDisplayValue(quantity, ingredientUnit)
              
              // Get image URL
              const imageUrl = ingredient?.ingredientImage ? getImageUrl(ingredient.ingredientImage) : null
              
              // Prefer the unit actually stored on the recipe item; older
              // recipes saved before this field existed won't have it, so
              // fall back to inferring it from the ingredient's category.
              const baseUnit = item.unit || getBaseUnit(ingredientUnit)

              return {
                ingredientId: item.ingredientId,
                quantity: quantity,
                baseUnit: baseUnit, // g/ml/pcs - sent back to the backend on save
                displayQuantity: formatDisplayQuantity(displayValue, displayUnit, ingredientUnit),
                ingredientName: ingredient?.ingredientName || 'Unknown',
                unit: ingredientUnit,
                costPrice: costPrice,
                cost: cost,
                displayUnit: displayUnit,
                displayValue: displayValue,
                imageUrl: imageUrl
              }
            })
            
            // Calculate initial recipe cost
            let totalCost = 0
            recipeItemsWithDetails.forEach(item => {
              const ingredient = ingredientsRes.data.data.find(ing => ing._id === item.ingredientId)
              if (ingredient) {
                const cost = calculateIngredientCost(item.quantity, ingredient.unit, ingredient.costPrice)
                totalCost += cost
              }
            })
            
            setFormData({
              recipeName: recipe.recipeName || '',
              recipeItems: recipeItemsWithDetails,
              recipeCost: Math.round(totalCost),
              profitPercentage: recipe.profitPercentage ? recipe.profitPercentage.toString() : '',
              sellingPrice: Math.round(recipe.sellingPrice || 0)
            })
            setCurrentImage(recipe.recipeImage || '')
          } else {
            setError('Recipe not found')
          }
        } else {
          setError('Failed to fetch recipe data')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data')
      } finally {
        setFetching(false)
        setLoadingIngredients(false)
      }
    }

    fetchData()
  }, [id])

  // Filter ingredients based on search
  useEffect(() => {
    const searchLower = ingredientSearch.toLowerCase()
    const filtered = ingredients.filter(ing => 
      ing.ingredientName.toLowerCase().includes(searchLower) ||
      ing.unit.toLowerCase().includes(searchLower)
    )
    setFilteredIngredients(filtered)
  }, [ingredientSearch, ingredients])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate recipe cost whenever recipeItems changes
  useEffect(() => {
    if (!fetching) {
      calculateRecipeCost()
    }
  }, [formData.recipeItems, ingredients])

  // Calculate selling price whenever recipeCost or profitPercentage changes
  useEffect(() => {
    if (!fetching) {
      calculateSellingPrice()
    }
  }, [formData.recipeCost, formData.profitPercentage])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'profitPercentage') {
      const numValue = parseFloat(value)
      if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError('')
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      if (error) setError('')
    }
    if (success) setSuccess('')
  }

  // Select ingredient from dropdown
  const selectIngredient = (ingredient) => {
    setCurrentIngredient(prev => ({
      ...prev,
      ingredientId: ingredient._id,
      unit: ingredient.unit === 'pcs' ? 'pcs' : 'g'
    }))
    setIngredientSearch(ingredient.ingredientName)
    setShowDropdown(false)
    if (error) setError('')
  }

  // Handle ingredient search input
  const handleIngredientSearch = (e) => {
    const value = e.target.value
    setIngredientSearch(value)
    setShowDropdown(true)
    if (currentIngredient.ingredientId) {
      const selected = ingredients.find(ing => ing._id === currentIngredient.ingredientId)
      if (selected && selected.ingredientName !== value) {
        setCurrentIngredient(prev => ({ ...prev, ingredientId: '' }))
      }
    }
  }

  // Handle quantity input
  const handleQuantityChange = (e) => {
    const { value } = e.target
    setCurrentIngredient(prev => ({ ...prev, quantity: value }))
    if (error) setError('')
  }

  // Handle unit change
  const handleUnitChange = (e) => {
    const { value } = e.target
    setCurrentIngredient(prev => ({ ...prev, unit: value }))
  }

  // Add ingredient to recipe
  const addIngredientToRecipe = () => {
    if (!currentIngredient.ingredientId) {
      setError('Please select an ingredient')
      return
    }
    if (!currentIngredient.quantity || parseFloat(currentIngredient.quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    const exists = formData.recipeItems.find(
      item => item.ingredientId === currentIngredient.ingredientId
    )
    if (exists) {
      setError('This ingredient is already added to the recipe')
      return
    }

    const ingredient = ingredients.find(ing => ing._id === currentIngredient.ingredientId)
    const quantityValue = parseFloat(currentIngredient.quantity)
    const unit = currentIngredient.unit || 'g'
    const ingredientUnit = ingredient?.unit || 'g'
    
    const baseQuantity = convertToBaseUnit(quantityValue, unit, ingredientUnit)
    const baseUnit = getBaseUnit(ingredientUnit)
    const cost = calculateIngredientCost(baseQuantity, ingredientUnit, ingredient?.costPrice || 0)
    const displayStr = formatDisplayQuantity(quantityValue, unit, ingredientUnit)
    const imageUrl = ingredient?.ingredientImage ? getImageUrl(ingredient.ingredientImage) : null

    setFormData(prev => ({
      ...prev,
      recipeItems: [
        ...prev.recipeItems,
        {
          ingredientId: currentIngredient.ingredientId,
          quantity: baseQuantity,
          baseUnit: baseUnit, // g/ml/pcs - the unit `quantity` is actually expressed in, sent to the backend
          displayQuantity: displayStr,
          ingredientName: ingredient?.ingredientName || 'Unknown',
          unit: ingredientUnit, // ingredient's own current stock unit - used only for the ₹/unit cost display below
          costPrice: ingredient?.costPrice || 0,
          cost: Math.round(cost * 100) / 100,
          originalQuantity: quantityValue,
          originalUnit: unit,
          imageUrl: imageUrl
        }
      ]
    }))
    setCurrentIngredient({ ingredientId: '', quantity: '', unit: 'g' })
    setIngredientSearch('')
    setError('')
  }

  // Remove ingredient from recipe
  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      recipeItems: prev.recipeItems.filter((_, i) => i !== index)
    }))
  }

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Validate form
  const validateForm = () => {
    if (!formData.recipeName.trim()) {
      setError('Recipe name is required')
      return false
    }
    if (formData.recipeName.length < 2) {
      setError('Recipe name must be at least 2 characters')
      return false
    }
    if (formData.recipeItems.length === 0) {
      setError('Please add at least one ingredient')
      return false
    }
    if (!formData.profitPercentage || parseFloat(formData.profitPercentage) <= 0) {
      setError('Please enter a valid profit percentage')
      return false
    }
    
    const cost = Number(formData.recipeCost)
    const selling = Number(formData.sellingPrice)
    
    if (!isNaN(cost) && !isNaN(selling) && parseFloat(formData.profitPercentage) > 0) {
      if (selling <= cost) {
        setError('Selling price must be greater than recipe cost')
        return false
      }
    }
    
    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      
      const formDataToSend = new FormData()
      formDataToSend.append('recipeName', formData.recipeName.trim())
      
      const itemsToSend = formData.recipeItems.map(item => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.baseUnit
      }))
      formDataToSend.append('recipeItems', JSON.stringify(itemsToSend))
      
      formDataToSend.append('recipeCost', Number(formData.recipeCost))
      formDataToSend.append('profitPercentage', Number(parseFloat(formData.profitPercentage).toFixed(2)))
      formDataToSend.append('sellingPrice', Number(formData.sellingPrice))
      
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/staff/editRecipe/${id}`,
        formDataToSend,
        { 
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      )

      if (response.data.status === 'SUCCESS') {
        setSuccess('Recipe updated successfully!')
        setTimeout(() => {
          navigate('/staffPanel/recipes')
        }, 1500)
      } else {
        setError(response.data.message || 'Failed to update recipe')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to update recipe'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Recipe not found')
        } else if (err.response.status === 409) {
          setError('Recipe already exists')
        } else if (err.response.status === 400) {
          setError(err.response.data?.message || 'Invalid data')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to update recipe. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-[#998f82]">Loading recipe...</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/staffPanel/recipes')}
          className="text-[#c5b7a2] hover:text-[#c9a962] transition-colors duration-300 p-2 rounded-lg hover:bg-white/5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Edit Recipe
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Update recipe details
          </p>
          <p className="text-xs text-[#8b7355] mt-0.5">
            ID: {id}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/5 border border-[#c9a962]/15 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipe Name */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Recipe Name *
            </label>
            <input
              type="text"
              name="recipeName"
              value={formData.recipeName}
              onChange={handleChange}
              placeholder="Enter recipe name"
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            />
            <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
              Minimum 2 characters, maximum 100 characters
            </p>
          </div>

          {/* Recipe Image */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Recipe Image
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#c9a962]/20 file:text-[#c9a962] file:cursor-pointer hover:file:bg-[#c9a962]/30"
              />
              {(imagePreview || currentImage) && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#c9a962]/30 flex-shrink-0">
                  <img 
                    src={imagePreview || `${import.meta.env.VITE_API_URL.replace('/api', '')}${currentImage}`} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                      setCurrentImage('')
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
              Maximum file size: 2MB. Leave empty to keep current image.
            </p>
          </div>

          {/* Ingredients Section */}
          <div className="border-t border-[#c9a962]/10 pt-4">
            <label className="block text-sm font-medium text-[#e6dfd5] mb-3">
              Recipe Ingredients *
            </label>
            
            {/* Add Ingredient Row with Searchable Dropdown */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1 relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={ingredientSearch}
                  onChange={handleIngredientSearch}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search ingredient..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
                />
                {showDropdown && filteredIngredients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#120f0c] border border-[#c9a962]/20 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                    {filteredIngredients.map((ing) => {
                      const imageUrl = ing.ingredientImage ? getImageUrl(ing.ingredientImage) : null
                      return (
                        <div
                          key={ing._id}
                          onClick={() => selectIngredient(ing)}
                          className="px-4 py-2 hover:bg-[#c9a962]/10 cursor-pointer transition-colors duration-200 flex items-center gap-3"
                        >
                          {imageUrl ? (
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0">
                              <img 
                                src={imageUrl} 
                                alt={ing.ingredientName} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center text-[#8b7355] text-sm bg-[#1a1510]">
                                      🍽️
                                    </div>
                                  `
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0 bg-[#1a1510] flex items-center justify-center text-[#8b7355] text-sm">
                              🍽️
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-sm font-medium block">{ing.ingredientName}</span>
                            <span className="text-[#8b7355] text-xs">{ing.unit} - ₹{ing.costPrice}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {showDropdown && filteredIngredients.length === 0 && ingredientSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-[#120f0c] border border-[#c9a962]/20 rounded-xl shadow-2xl p-4 text-center text-[#8b7355] text-sm">
                    No ingredients found
                  </div>
                )}
              </div>
              
              {/* Quantity Input */}
              <input
                type="number"
                name="quantity"
                value={currentIngredient.quantity}
                onChange={handleQuantityChange}
                placeholder="Qty"
                min="0.001"
                step="0.001"
                className="w-full sm:w-28 px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              />
              
              {/* Unit Dropdown */}
              <select
                name="unit"
                value={currentIngredient.unit}
                onChange={handleUnitChange}
                className="w-full sm:w-28 px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              >
                {currentIngredient.ingredientId ? (
                  (() => {
                    const selectedIngredient = ingredients.find(ing => ing._id === currentIngredient.ingredientId)
                    const units = selectedIngredient ? getAvailableUnits(selectedIngredient.unit) : [{ value: 'g', label: 'Gram' }]
                    return units.map((u) => (
                      <option key={u.value} value={u.value} className="bg-black/80">
                        {u.label}
                      </option>
                    ))
                  })()
                ) : (
                  <option value="g" className="bg-black/80">g</option>
                )}
              </select>
              
              <button
                type="button"
                onClick={addIngredientToRecipe}
                className="px-4 py-2.5 bg-[#c9a962]/20 text-[#c9a962] font-medium rounded-xl hover:bg-[#c9a962]/30 transition-all duration-300 cursor-pointer whitespace-nowrap"
              >
                Add
              </button>
            </div>
            
            <p className="text-[10px] text-[#8b7355]/70 mb-3">
              Type ingredient name to search, then enter quantity and select unit
            </p>

            {/* Ingredient List with Images */}
            {formData.recipeItems.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {formData.recipeItems.map((item, index) => {
                  const ingredient = ingredients.find(ing => ing._id === item.ingredientId)
                  const cost = ingredient ? calculateIngredientCost(item.quantity, ingredient.unit, ingredient.costPrice) : 0
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2 border border-[#c9a962]/10 hover:border-[#c9a962]/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Ingredient Image */}
                        {item.imageUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.ingredientName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-[#8b7355] text-sm bg-[#1a1510]">
                                    🍽️
                                  </div>
                                `
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0 bg-[#1a1510] flex items-center justify-center text-[#8b7355] text-lg">
                            🍽️
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm text-white font-medium">{item.ingredientName}</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[#c9a962] font-semibold bg-[#c9a962]/10 px-2 py-0.5 rounded-full">
                              {item.displayQuantity}
                            </span>
                            <span className="text-xs text-[#8b7355]">× ₹{item.costPrice}/{item.unit}</span>
                            <span className="text-xs text-[#8b7355]">= ₹{Math.round(cost * 100) / 100}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1 hover:bg-red-500/10 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#8b7355] italic">No ingredients added yet</p>
            )}
          </div>

          {/* Cost & Price Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Recipe Cost */}
            <div>
              <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                Recipe Cost (₹)
              </label>
              <input
                type="number"
                value={formData.recipeCost}
                readOnly
                className="w-full px-4 py-2.5 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl text-[#c9a962] font-semibold cursor-not-allowed"
              />
              <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
                Auto-calculated from ingredients (rounded to nearest ₹)
              </p>
            </div>

            {/* Profit Percentage */}
            <div>
              <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                Profit Percentage (%) *
              </label>
              <input
                type="number"
                name="profitPercentage"
                value={formData.profitPercentage}
                onChange={handleChange}
                placeholder="Enter profit %"
                min="1"
                step="0.01"
                className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
                required
              />
              <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
                Enter desired profit percentage (e.g., 80.50)
              </p>
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={formData.sellingPrice}
                readOnly
                className="w-full px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-semibold cursor-not-allowed"
              />
              <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
                Auto-calculated from cost + profit (rounded to nearest ₹)
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </div>
              ) : (
                'Update Recipe'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/staffPanel/recipes')}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#998f82] hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRecipe