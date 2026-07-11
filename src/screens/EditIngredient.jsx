import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const EditIngredient = ({ id: propId }) => {
  const navigate = useNavigate()
  const params = useParams()
  const id = propId || params.id
  
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(true)
  
  const [formData, setFormData] = useState({
    ingredientName: '',
    categoryId: '',
    subCategoryId: '',
    brandId: '',
    unit: '',
    costPrice: ''
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [currentImage, setCurrentImage] = useState('')

  // Fetch categories, brands, and ingredient data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('Ingredient ID is missing')
        setFetching(false)
        return
      }

      try {
        const token = localStorage.getItem('token')
        
        // Fetch categories (only active ones)
        const categoriesRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllCategory`,
          { headers: { token } }
        )
        if (categoriesRes.data.status === 'SUCCESS') {
          const activeCategories = categoriesRes.data.data.filter(cat => cat.isActive === true)
          setCategories(activeCategories)
        }

        // Fetch brands (only active ones)
        const brandsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllBrand`,
          { headers: { token } }
        )
        if (brandsRes.data.status === 'SUCCESS') {
          const activeBrands = brandsRes.data.data.filter(brand => brand.isActive === true)
          setBrands(activeBrands)
        }

        // Fetch ingredient to edit
        const ingredientRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllIngredient`,
          { headers: { token } }
        )
        
        if (ingredientRes.data.status === 'SUCCESS') {
          const ingredient = ingredientRes.data.data.find(i => i._id === id)
          if (ingredient) {
            setFormData({
              ingredientName: ingredient.ingredientName || '',
              categoryId: ingredient.categoryId?._id || ingredient.categoryId || '',
              subCategoryId: ingredient.subCategoryId?._id || ingredient.subCategoryId || '',
              brandId: ingredient.brandId?._id || ingredient.brandId || '',
              unit: ingredient.unit || '',
              costPrice: ingredient.costPrice || ''
            })
            setCurrentImage(ingredient.ingredientImage || '')
            
            // Fetch subcategories for the selected category
            if (ingredient.categoryId?._id || ingredient.categoryId) {
              const categoryId = ingredient.categoryId?._id || ingredient.categoryId
              const subRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/staff/viewAllSubCategory`,
                { headers: { token } }
              )
              if (subRes.data.status === 'SUCCESS') {
                const filteredSubs = subRes.data.data.filter(
                  sub => sub.categoryId?._id === categoryId && sub.isActive === true
                )
                setSubcategories(filteredSubs)
              }
            }
          } else {
            setError('Ingredient not found')
          }
        } else {
          setError('Failed to fetch ingredient data')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data')
      } finally {
        setFetching(false)
        setLoadingCategories(false)
        setLoadingBrands(false)
      }
    }

    fetchData()
  }, [id])

  // Fetch subcategories based on selected category
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.categoryId) {
        setSubcategories([])
        return
      }

      setLoadingSubcategories(true)
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllSubCategory`,
          { headers: { token } }
        )
        if (response.data.status === 'SUCCESS') {
          const filteredSubcategories = response.data.data.filter(
            sub => sub.categoryId?._id === formData.categoryId && sub.isActive === true
          )
          setSubcategories(filteredSubcategories)
        }
      } catch (err) {
        setError('Failed to load subcategories')
      } finally {
        setLoadingSubcategories(false)
      }
    }

    if (!fetching) {
      fetchSubcategories()
    }
  }, [formData.categoryId, fetching])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
    
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, subCategoryId: '' }))
    }
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
    if (!formData.ingredientName.trim()) {
      setError('Ingredient name is required')
      return false
    }
    if (formData.ingredientName.length < 2) {
      setError('Ingredient name must be at least 2 characters')
      return false
    }
    if (!formData.categoryId) {
      setError('Please select a category')
      return false
    }
    if (!formData.brandId) {
      setError('Please select a brand')
      return false
    }
    if (!formData.unit) {
      setError('Please select a unit')
      return false
    }
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
      setError('Please enter a valid cost price')
      return false
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
      formDataToSend.append('ingredientName', formData.ingredientName.trim())
      formDataToSend.append('categoryId', formData.categoryId)
      if (formData.subCategoryId) {
        formDataToSend.append('subCategoryId', formData.subCategoryId)
      }
      formDataToSend.append('brandId', formData.brandId)
      formDataToSend.append('unit', formData.unit)
      formDataToSend.append('costPrice', formData.costPrice)
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/staff/editIngredient/${id}`,
        formDataToSend,
        { 
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      )

      if (response.data.status === 'SUCCESS') {
        setSuccess('Ingredient updated successfully!')
        setTimeout(() => {
          navigate('/staffPanel/ingredients')
        }, 1500)
      } else {
        setError(response.data.message || 'Failed to update ingredient')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to update ingredient'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Ingredient not found')
        } else if (err.response.status === 409) {
          setError('Ingredient already exists')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to update ingredient. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Unit options
  const unitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'g', label: 'Gram (g)' },
    { value: 'ltr', label: 'Litre (ltr)' },
    { value: 'ml', label: 'Millilitre (ml)' },
    { value: 'pcs', label: 'Pieces (pcs)' }
  ]

  // Loading state
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-3 text-[#998f82]">Loading ingredient...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/staffPanel/ingredients')}
          className="text-[#c5b7a2] hover:text-[#c9a962] transition-colors duration-300 p-2 rounded-lg hover:bg-white/5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Edit Ingredient
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Update ingredient details
          </p>
          <p className="text-xs text-[#8b7355] mt-0.5">
            ID: {id}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/5 border border-[#c9a962]/15 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ingredient Name */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Ingredient Name *
            </label>
            <input
              type="text"
              name="ingredientName"
              value={formData.ingredientName}
              onChange={handleChange}
              placeholder="Enter ingredient name"
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            />
            <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
              Minimum 2 characters, maximum 50 characters
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            >
              <option value="" className="bg-black">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id} className="bg-black/80">
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Subcategory
            </label>
            <select
              name="subCategoryId"
              value={formData.subCategoryId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
            >
              <option value="" className="bg-black">None (Optional)</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory._id} className="bg-black/80">
                  {subcategory.subCategoryName}
                </option>
              ))}
            </select>
            {loadingSubcategories && (
              <p className="text-xs text-[#8b7355] mt-1">Loading subcategories...</p>
            )}
          </div>

          {/* Brand Selection */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Brand *
            </label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            >
              <option value="" className="bg-black">Select a brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id} className="bg-black/80">
                  {brand.brandName}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Unit *
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            >
              <option value="" className="bg-black">Select a unit</option>
              {unitOptions.map((unit) => (
                <option key={unit.value} value={unit.value} className="bg-black/80">
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Cost Price (₹) *
            </label>
            <input
              type="number"
              name="costPrice"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="Enter cost price"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            />
            <p className="text-[10px] text-[#8b7355]/70 mt-1.5 tracking-wide">
              Must be greater than 0
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Ingredient Image
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
                    src={imagePreview || currentImage} 
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
                'Update Ingredient'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/staffPanel/ingredients')}
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

export default EditIngredient