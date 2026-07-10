import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AddPurchase = () => {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [filteredIngredients, setFilteredIngredients] = useState([])
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null)
  const dropdownRef = useRef(null)
  
  const [formData, setFormData] = useState({
    vendorId: '',
    purchaseItems: [
      {
        ingredientId: '',
        ingredientName: '',
        unit: '',
        quantity: '',
        unitCost: '',
        totalCost: '',
        manufacturingDate: '',
        expiryDate: '',
        imageUrl: ''
      }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get tomorrow's date for min expiry date (expiry must be after today)
  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${baseUrl}${imagePath}`
  }

  // Fetch vendors and ingredients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch vendors (only active ones)
        const vendorsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllVendor`,
          { headers: { token } }
        )
        if (vendorsRes.data.status === 'SUCCESS') {
          setVendors(vendorsRes.data.data.filter(v => v.isActive === true))
        }

        // Fetch ingredients (only active ones)
        const ingredientsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllIngredient`,
          { headers: { token } }
        )
        if (ingredientsRes.data.status === 'SUCCESS') {
          const activeIngredients = ingredientsRes.data.data.filter(i => i.isActive === true)
          setIngredients(activeIngredients)
          setFilteredIngredients(activeIngredients)
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoadingVendors(false)
        setLoadingIngredients(false)
      }
    }
    fetchData()
  }, [])

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
        setActiveDropdownIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate total amount
  useEffect(() => {
    let total = 0
    formData.purchaseItems.forEach(item => {
      total += parseFloat(item.totalCost) || 0
    })
    setTotalAmount(Math.round(total))
  }, [formData.purchaseItems])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  // Select ingredient from dropdown
  const selectIngredient = (ingredient, index) => {
    const updatedItems = [...formData.purchaseItems]
    updatedItems[index] = {
      ...updatedItems[index],
      ingredientId: ingredient._id,
      ingredientName: ingredient.ingredientName,
      unit: ingredient.unit,
      unitCost: ingredient.costPrice,
      imageUrl: getImageUrl(ingredient.ingredientImage)
    }
    // Auto-calculate total cost
    const quantity = parseFloat(updatedItems[index].quantity) || 0
    const unitCost = parseFloat(updatedItems[index].unitCost) || 0
    updatedItems[index].totalCost = Math.round(quantity * unitCost)
    
    setFormData(prev => ({ ...prev, purchaseItems: updatedItems }))
    setIngredientSearch('')
    setShowDropdown(false)
    setActiveDropdownIndex(null)
    if (error) setError('')
  }

  // Handle ingredient search input
  const handleIngredientSearch = (index, e) => {
    const value = e.target.value
    setIngredientSearch(value)
    setShowDropdown(true)
    setActiveDropdownIndex(index)
    
    if (formData.purchaseItems[index].ingredientId) {
      const selected = ingredients.find(ing => ing._id === formData.purchaseItems[index].ingredientId)
      if (selected && selected.ingredientName !== value) {
        const updatedItems = [...formData.purchaseItems]
        updatedItems[index] = {
          ...updatedItems[index],
          ingredientId: '',
          ingredientName: '',
          unit: '',
          unitCost: '',
          totalCost: '',
          imageUrl: ''
        }
        setFormData(prev => ({ ...prev, purchaseItems: updatedItems }))
      }
    }
  }

  // Handle item input changes
  const handleItemChange = (index, e) => {
    const { name, value } = e.target
    const updatedItems = [...formData.purchaseItems]
    updatedItems[index] = { ...updatedItems[index], [name]: value }
    
    // Auto-calculate total cost
    if (name === 'quantity' || name === 'unitCost') {
      const quantity = parseFloat(updatedItems[index].quantity) || 0
      const unitCost = parseFloat(updatedItems[index].unitCost) || 0
      updatedItems[index].totalCost = Math.round(quantity * unitCost)
    }
    
    // Validate dates
    if (name === 'manufacturingDate' || name === 'expiryDate') {
      const manuDate = updatedItems[index].manufacturingDate
      const expDate = updatedItems[index].expiryDate
      
      if (manuDate && expDate && expDate <= manuDate) {
        setError('Expiry date must be after manufacturing date')
      } else {
        setError('')
      }
    }
    
    setFormData(prev => ({ ...prev, purchaseItems: updatedItems }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  // Add item row
  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      purchaseItems: [
        ...prev.purchaseItems,
        {
          ingredientId: '',
          ingredientName: '',
          unit: '',
          quantity: '',
          unitCost: '',
          totalCost: '',
          manufacturingDate: '',
          expiryDate: '',
          imageUrl: ''
        }
      ]
    }))
  }

  // Remove item row
  const removeItemRow = (index) => {
    if (formData.purchaseItems.length <= 1) {
      setError('At least one item is required')
      return
    }
    const updatedItems = formData.purchaseItems.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, purchaseItems: updatedItems }))
  }

  // Validate form
  const validateForm = () => {
    if (!formData.vendorId) {
      setError('Please select a vendor')
      return false
    }
    
    for (let i = 0; i < formData.purchaseItems.length; i++) {
      const item = formData.purchaseItems[i]
      if (!item.ingredientId) {
        setError(`Please select an ingredient for item ${i + 1}`)
        return false
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setError(`Please enter valid quantity for item ${i + 1}`)
        return false
      }
      if (!item.unitCost || parseFloat(item.unitCost) <= 0) {
        setError(`Please enter valid unit cost for item ${i + 1}`)
        return false
      }
      if (!item.manufacturingDate) {
        setError(`Please select manufacturing date for item ${i + 1}`)
        return false
      }
      if (!item.expiryDate) {
        setError(`Please select expiry date for item ${i + 1}`)
        return false
      }
      
      // Check if expiry date is after today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const expDate = new Date(item.expiryDate)
      expDate.setHours(0, 0, 0, 0)
      
      if (expDate <= today) {
        setError(`Expiry date must be after today for item ${i + 1}`)
        return false
      }
      
      // Check if expiry date is after manufacturing date
      const manuDate = new Date(item.manufacturingDate)
      manuDate.setHours(0, 0, 0, 0)
      
      if (expDate <= manuDate) {
        setError(`Expiry date must be after manufacturing date for item ${i + 1}`)
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
      
      const payload = {
        vendorId: formData.vendorId,
        totalAmount: totalAmount,
        purchaseItems: formData.purchaseItems.map(item => ({
          ingredientId: item.ingredientId,
          quantity: parseFloat(item.quantity),
          unitCost: parseFloat(item.unitCost),
          totalCost: parseFloat(item.totalCost),
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate
        }))
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/staff/addPurchase`,
        payload,
        { headers: { token } }
      )

      if (response.data.status === 'SUCCESS') {
        setSuccess('Purchase added successfully!')
        setFormData({
          vendorId: '',
          purchaseItems: [
            {
              ingredientId: '',
              ingredientName: '',
              unit: '',
              quantity: '',
              unitCost: '',
              totalCost: '',
              manufacturingDate: '',
              expiryDate: '',
              imageUrl: ''
            }
          ]
        })
        setTotalAmount(0)
        setTimeout(() => {
          navigate('/staffPanel/purchases')
        }, 1500)
      } else {
        setError(response.data.message || 'Failed to add purchase')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to add purchase'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 404) {
          setError('Vendor or ingredient not found')
        } else if (err.response.status === 409) {
          setError('Batch already exists for this ingredient')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to add purchase. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/staffPanel/purchases')}
          className="text-[#c5b7a2] hover:text-[#c9a962] transition-colors duration-300 p-2 rounded-lg hover:bg-white/5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Add Purchase
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Create a new purchase order
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white/5 border border-[#c9a962]/15 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">
              Vendor *
            </label>
            <select
              name="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              required
            >
              <option value="" className="bg-black">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id} className="bg-black/80">
                  {vendor.vendorName}
                </option>
              ))}
            </select>
            {loadingVendors && (
              <p className="text-xs text-[#8b7355] mt-1">Loading vendors...</p>
            )}
          </div>

          {/* Purchase Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#e6dfd5]">
                Purchase Items *
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-[#c9a962] hover:text-[#e8d5a3] transition-colors duration-300 cursor-pointer flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            {formData.purchaseItems.map((item, index) => (
              <div key={index} className="bg-white/5 border border-[#c9a962]/10 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#e6dfd5]">Item {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors duration-300 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ingredient with Searchable Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-medium text-[#e6dfd5] mb-1">
                      Ingredient *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={activeDropdownIndex === index ? ingredientSearch : item.ingredientName || ''}
                        onChange={(e) => handleIngredientSearch(index, e)}
                        onFocus={() => {
                          setShowDropdown(true)
                          setActiveDropdownIndex(index)
                          setIngredientSearch('')
                        }}
                        placeholder="Search ingredient..."
                        className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 text-sm pl-10"
                      />
                      {item.imageUrl ? (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-lg overflow-hidden border border-[#c9a962]/20">
                          <img 
                           src={ingredient.ingredientImage}
                            alt="ingredient" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-[#8b7355] text-xs bg-[#1a1510]">
                                  🍽️
                                </div>
                              `
                            }}
                          />
                        </div>
                      ) : (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-lg overflow-hidden border border-[#c9a962]/20 bg-[#1a1510] flex items-center justify-center text-[#8b7355] text-xs">
                          🍽️
                        </div>
                      )}
                    </div>
                    {showDropdown && activeDropdownIndex === index && filteredIngredients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-[#120f0c] border border-[#c9a962]/20 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                        {filteredIngredients.map((ing) => {
                          const imageUrl = ing.ingredientImage ? getImageUrl(ing.ingredientImage) : null
                          return (
                            <div
                              key={ing._id}
                              onClick={() => selectIngredient(ing, index)}
                              className="px-4 py-2 hover:bg-[#c9a962]/10 cursor-pointer transition-colors duration-200 flex items-center gap-3"
                            >
                              {imageUrl ? (
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0">
                                  <img 
                                     src={ingredient.ingredientImage}
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
                                <span className="text-[#8b7355] text-xs">Unit: {ing.unit} | Cost: ₹{ing.costPrice}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {showDropdown && activeDropdownIndex === index && filteredIngredients.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-[#120f0c] border border-[#c9a962]/20 rounded-xl shadow-2xl p-4 text-center text-[#8b7355] text-sm">
                        No ingredients found
                      </div>
                    )}
                  </div>

                  {/* Quantity with Unit Display */}
                  <div>
                    <label className="block text-xs font-medium text-[#e6dfd5] mb-1">
                      Quantity ({item.unit || 'unit'}) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        placeholder="Enter quantity"
                        className="flex-1 px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 text-sm"
                        required
                        step="0.001"
                        min="0"
                      />
                      <span className="inline-flex items-center px-3 py-2 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl text-[#c9a962] text-sm font-medium whitespace-nowrap min-w-[50px] justify-center">
                        {item.unit || 'unit'}
                      </span>
                    </div>
                  </div>

                  {/* Unit Cost */}
                  <div>
                    <label className="block text-xs font-medium text-[#e6dfd5] mb-1">
                      Unit Cost (₹) *
                    </label>
                    <input
                      type="number"
                      name="unitCost"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(index, e)}
                      placeholder="Auto-filled from ingredient"
                      className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 text-sm"
                      required
                      step="0.01"
                      min="0"
                    />
                    <p className="text-[10px] text-[#8b7355]/70 mt-1">
                      Auto-filled when ingredient is selected
                    </p>
                  </div>

                  {/* Total Cost (Auto-calculated) */}
                  <div>
                    <label className="block text-xs font-medium text-[#e6dfd5] mb-1">
                      Total Cost (₹)
                    </label>
                    <input
                      type="text"
                      value={item.totalCost ? `₹${parseInt(item.totalCost)}` : '₹0'}
                      className="w-full px-3 py-2 bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-xl text-[#c9a962] font-semibold focus:outline-none transition-all duration-300 text-sm cursor-default"
                      disabled
                    />
                  </div>

                  {/* Manufacturing Date */}
                  <div>
                    <label className="block text-xs font-medium text-[#e6dfd5] mb-1">
                      Manufacturing Date *
                    </label>
                    <input
                      type="date"
                      name="manufacturingDate"
                      value={item.manufacturingDate}
                      onChange={(e) => handleItemChange(index, e)}
                      max={getTodayDate()}
                      className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 text-sm"
                      required
                    />
                    <p className="text-[10px] text-[#8b7355]/70 mt-1">
                      Can be today or any past date
                    </p>
                  </div>

                  {/* Expiry Date - Disabled past dates */}
                  <div>
                    <label className="block text-xs font-medium text-[#e6dfd5] mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={item.expiryDate}
                      onChange={(e) => handleItemChange(index, e)}
                      min={getTomorrowDate()}
                      className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 text-sm"
                      required
                    />
                    <p className="text-[10px] text-[#c9a962]/70 mt-1">
                      Must be after today and after manufacturing date
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Amount */}
          <div className="flex justify-end items-center gap-4 p-4 bg-white/5 rounded-xl border border-[#c9a962]/10">
            <span className="text-sm font-medium text-[#e6dfd5]">Total Amount:</span>
            <span className="text-2xl font-bold text-[#c9a962]">
              ₹{totalAmount}
            </span>
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
                  Creating...
                </div>
              ) : (
                'Create Purchase'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/staffPanel/purchases')}
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

export default AddPurchase