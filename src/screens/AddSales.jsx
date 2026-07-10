import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Stable, collision-safe id generator for table rows
let idCounter = 0
const nextId = (prefix) => `${prefix}-${Date.now()}-${idCounter++}`

const emptyDraft = { itemName: '', quantity: '', rate: '', discount: '', tax: '' }

const AddSales = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ---- Shared: recipe list ----
  const [recipes, setRecipes] = useState([])

  // ---- PDF upload + preview state ----
  const [pdfFile, setPdfFile] = useState(null)
  const [salesDate, setSalesDate] = useState(null)
  const [pdfMeta, setPdfMeta] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [hasPreviewed, setHasPreviewed] = useState(false)

  // "Add missing item" mini-form
  const [showAddRow, setShowAddRow] = useState(false)
  const [addDraft, setAddDraft] = useState(emptyDraft)
  const [addSearchTerm, setAddSearchTerm] = useState('')
  const [addShowDropdown, setAddShowDropdown] = useState(false)
  const addDropdownRef = useRef(null)

  // Per-row recipe-picker
  const [recipePickerRowId, setRecipePickerRowId] = useState(null)
  const [recipePickerSearch, setRecipePickerSearch] = useState('')
  const recipePickerRef = useRef(null)

  // ---- No-PDF manual entry tab ----
  const [manualItems, setManualItems] = useState([])
  const [manualDate, setManualDate] = useState('')
  const [manualDraft, setManualDraft] = useState(emptyDraft)
  const [manualEditingIndex, setManualEditingIndex] = useState(null)
  const [manualSearchTerm, setManualSearchTerm] = useState('')
  const [manualShowDropdown, setManualShowDropdown] = useState(false)
  const manualDropdownRef = useRef(null)

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/staff/viewAllRecipe`,
          { headers: { token } }
        )
        if (response.data.status === 'SUCCESS') {
          setRecipes(response.data.data || [])
        }
      } catch (err) {
        console.error('Error fetching recipes:', err)
      }
    }
    fetchRecipes()
  }, [])

  useEffect(() => {
    if (!manualDate) setManualDate(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target)) {
        setAddShowDropdown(false)
      }
      if (manualDropdownRef.current && !manualDropdownRef.current.contains(event.target)) {
        setManualShowDropdown(false)
      }
      if (recipePickerRef.current && !recipePickerRef.current.contains(event.target)) {
        setRecipePickerRowId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ============================================
  // Helpers
  // ============================================

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0)

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${baseUrl}${imagePath}`
  }

  const filteredRecipesFor = (term) =>
    recipes.filter(r => r.recipeName?.toLowerCase().includes(term.toLowerCase())).slice(0, 8)

  // Compute row money fields
  const computeRow = (row) => {
    const quantity = Number(row.quantity) || 0
    const discount = Number(row.discount) || 0
    const tax = Number(row.tax) || 0
    const sellingPrice = row.sellingPrice != null ? Number(row.sellingPrice) : Number(row.rate) || 0
    const recipeCost = row.recipeCost != null ? Number(row.recipeCost) : 0
    const gross = sellingPrice * quantity
    const net = gross - discount + tax
    const cost = recipeCost * quantity
    const profit = net - cost
    const hasRecipe = !!row.recipeId
    const hasQty = quantity > 0
    const isValid = hasRecipe && hasQty && (row.stockAvailable !== false)
    return { gross, net, cost, profit, isValid, hasRecipe, hasQty }
  }

  const totals = useMemo(() => {
    let net = 0, gross = 0, profit = 0, validCount = 0
    rows.forEach(row => {
      const c = computeRow(row)
      if (c.isValid) {
        net += c.net
        gross += c.gross
        profit += c.profit
        validCount++
      }
    })
    return { net, gross, profit, validCount }
  }, [rows])

  // ============================================
  // PDF upload + preview
  // ============================================

  const resetPreview = () => {
    setRows([])
    setHasPreviewed(false)
    setSalesDate(null)
    setPdfMeta(null)
    setShowAddRow(false)
    setAddDraft(emptyDraft)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      setPdfFile(null)
      resetPreview()
      return
    }
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file')
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      e.target.value = ''
      return
    }
    // Reset preview when new file is selected
    resetPreview()
    setPdfFile(file)
    setError('')
    setSuccess('')
  }

  const handlePreview = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first')
      return
    }
    setPreviewLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('pdf', pdfFile)

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/sales/preview`,
        formData,
        { headers: { token, 'Content-Type': 'multipart/form-data' } }
      )

      if (response.data.status === 'SUCCESS') {
        const data = response.data.data
        const builtRows = (data.items || []).map((item, i) => ({
          id: nextId('pdf'),
          source: 'pdf',
          itemName: item.pdfItemName || '',
          quantity: item.quantity ?? '',
          rate: item.pdfRate ?? '',
          discount: item.discount || 0,
          tax: item.tax || 0,
          recipeId: item.recipeId || null,
          recipeName: item.recipeName || null,
          recipeImage: item.recipeImage || null,
          sellingPrice: item.sellingPrice,
          recipeCost: item.recipeCost,
          recipeFound: !!item.recipeFound,
          stockAvailable: item.stockAvailable,
          stockDetails: item.stockDetails,
          ingredients: item.ingredients || [],
          isEditing: false
        }))
        setRows(builtRows)
        setSalesDate(data.salesDate)
        setPdfMeta({ 
          pdfFileName: data.pdfFileName, 
          pdfFilePath: data.pdfFilePath 
        })
        setHasPreviewed(true)
      } else {
        setError(response.data.message || 'Failed to preview PDF')
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || 'Failed to preview PDF')
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to preview PDF. Please try again.')
      }
    } finally {
      setPreviewLoading(false)
    }
  }

  // ---- Row-level editing ----

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const toggleEditRow = (id) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, isEditing: !r.isEditing } : r))
  }

  const deleteRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const attachRecipeToRow = (id, recipe) => {
    setRows(prev => prev.map(r => r.id === id ? {
      ...r,
      recipeId: recipe._id,
      recipeName: recipe.recipeName,
      recipeImage: recipe.recipeImage || null,
      sellingPrice: recipe.sellingPrice,
      recipeCost: recipe.recipeCost,
      recipeFound: true,
      rate: r.rate || recipe.sellingPrice,
      stockAvailable: undefined,
      stockDetails: 'Will be verified when you approve.'
    } : r))
    setRecipePickerRowId(null)
    setRecipePickerSearch('')
  }

  // ---- "Add missing item" ----

  const addMissingItem = () => {
    if (!addDraft.itemName.trim()) { setError('Please choose an item'); return }
    if (!addDraft.recipeId) { setError('Please select a recipe from the list'); return }
    if (!addDraft.quantity || Number(addDraft.quantity) <= 0) { setError('Please enter a valid quantity'); return }

    setRows(prev => [...prev, {
      id: nextId('manual'),
      source: 'manual',
      itemName: addDraft.itemName.trim(),
      quantity: Number(addDraft.quantity),
      rate: Number(addDraft.rate) || addDraft.sellingPrice || 0,
      discount: Number(addDraft.discount) || 0,
      tax: Number(addDraft.tax) || 0,
      recipeId: addDraft.recipeId,
      recipeName: addDraft.itemName.trim(),
      recipeImage: addDraft.recipeImage || null,
      sellingPrice: addDraft.sellingPrice,
      recipeCost: addDraft.recipeCost,
      recipeFound: true,
      stockAvailable: undefined,
      stockDetails: 'Will be verified when you approve.',
      ingredients: [],
      isEditing: false
    }])
    setAddDraft(emptyDraft)
    setAddSearchTerm('')
    setError('')
  }

  const selectRecipeForAddRow = (recipe) => {
    setAddDraft(prev => ({
      ...prev,
      itemName: recipe.recipeName,
      recipeId: recipe._id,
      recipeImage: recipe.recipeImage || null,
      rate: recipe.sellingPrice,
      sellingPrice: recipe.sellingPrice,
      recipeCost: recipe.recipeCost
    }))
    setAddSearchTerm(recipe.recipeName)
    setAddShowDropdown(false)
  }

  // ---- Approve ----
  // IMPORTANT: Send file path from preview instead of the file itself

  const handleApprove = async () => {
    const finalItems = rows
      .map(r => ({
        itemName: r.itemName,
        quantity: Number(r.quantity) || 0,
        rate: Number(r.rate) || 0,
        discount: Number(r.discount) || 0,
        tax: Number(r.tax) || 0,
        recipeId: r.recipeId || undefined
      }))
      .filter(item => item.recipeId && item.quantity > 0)

    if (finalItems.length === 0) {
      setError('No valid items to process. Every row needs a matched recipe and a quantity greater than 0.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      
      // Send the file path from preview
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/sales/approve`,
        {
          pdfFilePath: pdfMeta?.pdfFilePath,
          items: finalItems
        },
        { headers: { token, 'Content-Type': 'application/json' } }
      )

      if (response.data.status === 'SUCCESS') {
        setSuccess(`Sales processed successfully! ${response.data.data.totalItems} items sold.`)
        setPdfFile(null)
        resetPreview()
        setTimeout(() => navigate('/staffPanel/sales'), 1800)
      } else {
        setError(response.data.message || 'Failed to process sales')
      }
    } catch (err) {
      if (err.response) {
        const message = err.response.data?.message || 'Failed to process sales'
        if (err.response.status === 401) {
          setError('Session expired. Please login again.')
        } else if (err.response.status === 400) {
          setError(err.response.data?.message || 'Invalid data. Please check your items.')
        } else {
          setError(message)
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to process sales. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // No-PDF manual entry tab
  // ============================================

  const addManualItem = () => {
    if (!manualDraft.itemName.trim()) { setError('Please enter item name'); return }
    if (!manualDraft.quantity || Number(manualDraft.quantity) <= 0) { setError('Please enter a valid quantity'); return }
    if (!manualDraft.rate || Number(manualDraft.rate) <= 0) { setError('Please enter a valid rate'); return }

    const item = {
      itemName: manualDraft.itemName.trim(),
      quantity: Number(manualDraft.quantity),
      rate: Number(manualDraft.rate),
      discount: Number(manualDraft.discount) || 0,
      tax: Number(manualDraft.tax) || 0
    }

    if (manualEditingIndex !== null) {
      const updated = [...manualItems]
      updated[manualEditingIndex] = item
      setManualItems(updated)
      setManualEditingIndex(null)
    } else {
      setManualItems([...manualItems, item])
    }
    setManualDraft(emptyDraft)
    setManualSearchTerm('')
    setError('')
  }

  const removeManualItem = (index) => setManualItems(manualItems.filter((_, i) => i !== index))

  const editManualItem = (index) => {
    const item = manualItems[index]
    setManualDraft({ 
      itemName: item.itemName, 
      quantity: item.quantity, 
      rate: item.rate, 
      discount: item.discount || 0, 
      tax: item.tax || 0 
    })
    setManualSearchTerm(item.itemName)
    setManualEditingIndex(index)
  }

  const selectRecipeForManual = (recipe) => {
    setManualDraft(prev => ({ 
      ...prev, 
      itemName: recipe.recipeName, 
      rate: recipe.sellingPrice 
    }))
    setManualSearchTerm(recipe.recipeName)
    setManualShowDropdown(false)
  }

  const manualTotals = useMemo(() => {
    let gross = 0, discount = 0, tax = 0
    manualItems.forEach(item => {
      gross += item.quantity * item.rate
      discount += item.discount || 0
      tax += item.tax || 0
    })
    return { gross, discount, tax, net: gross - discount + tax }
  }, [manualItems])

const handleManualSubmit = async () => {
  if (manualItems.length === 0) { 
    setError('Please add at least one item')
    return 
  }
  if (!manualDate) { 
    setError('Please select a sales date')
    return 
  }

  setLoading(true)
  setError('')
  setSuccess('')

  try {
    const token = localStorage.getItem('token')
    
    // 🔥 FIX: Format date as DD/MM/YYYY for backend
    const dateObj = new Date(manualDate)
    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    const formattedDate = `${day}/${month}/${year}`

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/sales/manual`,
      { 
        salesDate: formattedDate, 
        items: manualItems 
      },
      { headers: { token } }
    )

    if (response.data.status === 'SUCCESS') {
      setSuccess(`Sales added successfully! ${response.data.data.totalItems} items sold.`)
      setManualItems([])
      setManualDate(new Date().toISOString().split('T')[0])
      setTimeout(() => navigate('/staffPanel/sales'), 1800)
    } else {
      setError(response.data.message || 'Failed to add manual sales')
    }
  } catch (err) {
    if (err.response) {
      setError(err.response.status === 401
        ? 'Session expired. Please login again.'
        : (err.response.data?.message || 'Failed to add manual sales'))
    } else if (err.request) {
      setError('Unable to connect to server. Please check your network.')
    } else {
      setError('Failed to add manual sales. Please try again.')
    }
  } finally {
    setLoading(false)
  }
}

  // ============================================
  // Reusable UI components
  // ============================================

  const Spinner = () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )

  const StatusBadge = ({ row }) => {
    const c = computeRow(row)
    if (!c.hasRecipe) {
      return <span className="text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">No recipe matched</span>
    }
    if (!c.hasQty) {
      return <span className="text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">Missing quantity</span>
    }
    if (row.stockAvailable === false) {
      return <span className="text-[11px] font-medium bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">Insufficient stock</span>
    }
    if (row.stockAvailable === undefined) {
      return <span className="text-[11px] font-medium bg-[#c9a962]/15 text-[#c9a962] border border-[#c9a962]/30 px-2 py-0.5 rounded-full whitespace-nowrap">Will verify on approve</span>
    }
    return <span className="text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">Ready</span>
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/staffPanel/sales')}
          className="text-[#c5b7a2] hover:text-[#c9a962] transition-colors duration-300 p-2 rounded-lg hover:bg-white/5"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">Add Sales</h2>
          <p className="text-sm text-[#998f82] mt-1">Upload a POS PDF, review and fix anything it missed, then approve</p>
        </div>
      </div>

      {/* Mode switch */}
      <div className="flex gap-2 mb-6 bg-white/5 border border-[#c9a962]/15 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => { setMode('pdf'); setError(''); setSuccess('') }}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
            mode === 'pdf' ? 'bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] shadow-lg shadow-[#c9a962]/20' : 'text-[#998f82] hover:text-[#c5b7a2]'
          }`}
        >
          Upload PDF
        </button>
        <button
          type="button"
          onClick={() => { setMode('manual'); setError(''); setSuccess('') }}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
            mode === 'manual' ? 'bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] shadow-lg shadow-[#c9a962]/20' : 'text-[#998f82] hover:text-[#c5b7a2]'
          }`}
        >
          No PDF (Full Manual)
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* ===================== PDF MODE ===================== */}
      {mode === 'pdf' && (
        <div className="space-y-5">
          {/* Upload card */}
          <div className="bg-white/5 border border-[#c9a962]/15 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">Upload Sales PDF</label>
                <p className="text-xs text-[#8b7355]">The system extracts each line item and matches it to a recipe. Review everything below before approving.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a962]/10 border border-[#c9a962]/30 rounded-xl text-[#c9a962] text-sm font-medium cursor-pointer hover:bg-[#c9a962]/20 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Choose PDF
                </label>
                {pdfFile && (
                  <span className="text-xs text-[#c9a962] bg-[#c9a962]/10 px-3 py-1.5 rounded-full border border-[#c9a962]/20 max-w-[220px] truncate">
                    {pdfFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading || !pdfFile}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-[#c9a962]/25 text-[#c9a962] font-medium rounded-xl hover:bg-[#c9a962]/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {previewLoading ? (<><Spinner /> Extracting...</>) : (<>Preview PDF</>)}
            </button>

            {hasPreviewed && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading || totals.validCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (<><Spinner /> Processing...</>) : (<>Approve &amp; Save ({totals.validCount} item{totals.validCount === 1 ? '' : 's'})</>)}
              </button>
            )}
          </div>

          {/* Preview results */}
          {hasPreviewed && rows.length > 0 && (
            <div className="bg-white/5 border border-[#c9a962]/15 rounded-2xl overflow-hidden">
              {/* Summary strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-black/20 border-b border-[#c9a962]/10">
                <div className="text-center">
                  <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Sales Date</p>
                  <p className="text-sm font-bold text-white mt-0.5">{salesDate ? new Date(salesDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Rows Extracted</p>
                  <p className="text-lg font-bold text-white mt-0.5">{rows.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Ready to Save</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{totals.validCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#8b7355] uppercase tracking-wider">Net Revenue (est.)</p>
                  <p className="text-lg font-bold text-[#c9a962] mt-0.5">{formatCurrency(totals.net)}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm font-medium text-[#e6dfd5]">Extracted Items</p>
                  <p className="text-xs text-[#8b7355]">Click the pencil to edit a row, the recipe badge to fix a match, or the ✕ to remove it entirely</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-black/20 border-b border-[#c9a962]/10">
                        <th className="text-left text-xs font-medium text-[#8b7355] py-2.5 px-3">Item / Recipe</th>
                        <th className="text-right text-xs font-medium text-[#8b7355] py-2.5 px-3">Qty</th>
                        <th className="text-right text-xs font-medium text-[#8b7355] py-2.5 px-3">Rate</th>
                        <th className="text-right text-xs font-medium text-[#8b7355] py-2.5 px-3">Discount</th>
                        <th className="text-right text-xs font-medium text-[#8b7355] py-2.5 px-3">Tax</th>
                        <th className="text-right text-xs font-medium text-[#8b7355] py-2.5 px-3">Net</th>
                        <th className="text-center text-xs font-medium text-[#8b7355] py-2.5 px-3">Status</th>
                        <th className="text-center text-xs font-medium text-[#8b7355] py-2.5 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const c = computeRow(row)
                        const isPickingRecipe = recipePickerRowId === row.id
                        const pickerResults = filteredRecipesFor(recipePickerSearch)
                        const imageUrl = row.recipeImage ? getImageUrl(row.recipeImage) : null

                        return (
                          <tr key={row.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-200 ${!c.isValid ? 'bg-red-500/[0.03]' : ''}`}>
                            {/* Item / recipe */}
                            <td className="py-2.5 px-3 align-top min-w-[220px]">
                              {row.isEditing ? (
                                <input
                                  type="text"
                                  value={row.itemName}
                                  onChange={(e) => updateRow(row.id, 'itemName', e.target.value)}
                                  className="bg-white/5 border border-[#c9a962]/20 rounded-lg px-2 py-1.5 text-white text-sm w-full focus:outline-none focus:border-[#c9a962]"
                                  placeholder="Item name"
                                />
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2">
                                    {imageUrl && (
                                      <img src={row.recipeImage} alt={row.recipeName} className="w-7 h-7 rounded-lg object-cover border border-[#c9a962]/20 flex-shrink-0" />
                                    )}
                                    <span className={`text-sm ${row.itemName ? 'text-white' : 'text-red-400'}`}>
                                      {row.itemName || 'Empty name'}
                                    </span>
                                  </div>
                                  {row.recipeName && (
                                    <span className="text-xs text-[#8b7355] block ml-9">→ {row.recipeName}</span>
                                  )}
                                </div>
                              )}

                              {/* Fix / choose recipe */}
                              <div className="relative mt-1" ref={isPickingRecipe ? recipePickerRef : null}>
                                <button
                                  type="button"
                                  onClick={() => { setRecipePickerRowId(isPickingRecipe ? null : row.id); setRecipePickerSearch('') }}
                                  className="text-[11px] text-[#c9a962]/80 hover:text-[#c9a962] underline decoration-dotted underline-offset-2"
                                >
                                  {row.recipeId ? 'Change recipe' : 'Select recipe →'}
                                </button>
                                {isPickingRecipe && (
                                  <div className="absolute z-20 mt-1 w-72 bg-[#120f0c] border border-[#c9a962]/25 rounded-xl shadow-2xl">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={recipePickerSearch}
                                      onChange={(e) => setRecipePickerSearch(e.target.value)}
                                      placeholder="Search recipes..."
                                      className="w-full px-3 py-2 bg-transparent border-b border-[#c9a962]/15 text-white text-sm focus:outline-none"
                                    />
                                    <div className="max-h-48 overflow-y-auto">
                                      {pickerResults.length === 0 ? (
                                        <p className="text-xs text-[#8b7355] px-3 py-3">No matching recipes</p>
                                      ) : pickerResults.map(r => {
                                        const recipeImageUrl = r.recipeImage ? getImageUrl(r.recipeImage) : null
                                        return (
                                          <div
                                            key={r._id}
                                            onClick={() => attachRecipeToRow(row.id, r)}
                                            className="px-3 py-2 hover:bg-[#c9a962]/10 cursor-pointer flex items-center gap-3 text-sm text-white"
                                          >
                                            {recipeImageUrl ? (
                                              <img src={row.recipeImage} alt={r.recipeName} className="w-7 h-7 rounded-lg object-cover border border-[#c9a962]/20 flex-shrink-0" />
                                            ) : (
                                              <div className="w-7 h-7 rounded-lg bg-[#1a1510] flex items-center justify-center text-xs flex-shrink-0">🍳</div>
                                            )}
                                            <span className="flex-1 truncate">{r.recipeName}</span>
                                            <span className="text-xs text-[#8b7355]">₹{r.sellingPrice}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Qty */}
                            <td className="py-2.5 px-3 text-right align-top">
                              {row.isEditing ? (
                                <input
                                  type="number" step="0.001" value={row.quantity}
                                  onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                                  className="bg-white/5 border border-[#c9a962]/20 rounded-lg px-2 py-1.5 text-white text-sm w-16 text-right focus:outline-none focus:border-[#c9a962]"
                                />
                              ) : (
                                <span className={`text-sm ${row.quantity ? 'text-[#998f82]' : 'text-red-400'}`}>{row.quantity || 'Empty'}</span>
                              )}
                            </td>

                            {/* Rate */}
                            <td className="py-2.5 px-3 text-right align-top">
                              {row.isEditing ? (
                                <input
                                  type="number" step="0.01" value={row.rate}
                                  onChange={(e) => updateRow(row.id, 'rate', e.target.value)}
                                  className="bg-white/5 border border-[#c9a962]/20 rounded-lg px-2 py-1.5 text-white text-sm w-20 text-right focus:outline-none focus:border-[#c9a962]"
                                />
                              ) : (
                                <span className="text-sm text-[#c9a962]">{formatCurrency(row.rate)}</span>
                              )}
                            </td>

                            {/* Discount */}
                            <td className="py-2.5 px-3 text-right align-top">
                              {row.isEditing ? (
                                <input
                                  type="number" step="0.01" value={row.discount}
                                  onChange={(e) => updateRow(row.id, 'discount', e.target.value)}
                                  className="bg-white/5 border border-[#c9a962]/20 rounded-lg px-2 py-1.5 text-white text-sm w-16 text-right focus:outline-none focus:border-[#c9a962]"
                                />
                              ) : (
                                <span className="text-sm text-red-400/80">{formatCurrency(row.discount)}</span>
                              )}
                            </td>

                            {/* Tax */}
                            <td className="py-2.5 px-3 text-right align-top">
                              {row.isEditing ? (
                                <input
                                  type="number" step="0.01" value={row.tax}
                                  onChange={(e) => updateRow(row.id, 'tax', e.target.value)}
                                  className="bg-white/5 border border-[#c9a962]/20 rounded-lg px-2 py-1.5 text-white text-sm w-16 text-right focus:outline-none focus:border-[#c9a962]"
                                />
                              ) : (
                                <span className="text-sm text-yellow-400/80">{formatCurrency(row.tax)}</span>
                              )}
                            </td>

                            {/* Net */}
                            <td className="py-2.5 px-3 text-right align-top">
                              <span className="text-sm text-white font-medium">{formatCurrency(c.net)}</span>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center align-top">
                              <div className="flex flex-col items-center gap-1">
                                <StatusBadge row={row} />
                                {row.stockDetails && row.stockAvailable === false && (
                                  <span className="text-[10px] text-red-400/70 max-w-[140px] leading-tight">{row.stockDetails}</span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 align-top">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleEditRow(row.id)}
                                  className={`p-1.5 rounded-lg transition-colors duration-200 ${row.isEditing ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10' : 'text-[#8b7355] hover:text-[#c9a962] hover:bg-white/5'}`}
                                  title={row.isEditing ? 'Done' : 'Edit'}
                                >
                                  {row.isEditing ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteRow(row.id)}
                                  className="p-1.5 rounded-lg text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200"
                                  title="Remove this row - it will not be saved"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add a missing item */}
                <div className="mt-4 pt-4 border-t border-[#c9a962]/10">
                  {!showAddRow ? (
                    <button
                      type="button"
                      onClick={() => setShowAddRow(true)}
                      className="flex items-center gap-2 text-sm text-[#c9a962] hover:text-[#e8d5a3] transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      Add an item the PDF missed
                    </button>
                  ) : (
                    <div className="bg-black/20 border border-[#c9a962]/15 rounded-xl p-4">
                      <p className="text-xs text-[#8b7355] mb-3">Search for the recipe that was sold but didn't come through in the PDF.</p>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1" ref={addDropdownRef}>
                          <input
                            type="text"
                            value={addSearchTerm}
                            onChange={(e) => { setAddSearchTerm(e.target.value); setAddShowDropdown(true) }}
                            onFocus={() => setAddShowDropdown(true)}
                            placeholder="Search recipe..."
                            className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962]"
                          />
                          {addShowDropdown && addSearchTerm && (
                            <div className="absolute z-20 w-full mt-1 bg-[#120f0c] border border-[#c9a962]/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                              {filteredRecipesFor(addSearchTerm).map(recipe => {
                                const imageUrl = recipe.recipeImage ? getImageUrl(recipe.recipeImage) : null
                                return (
                                  <div key={recipe._id} onClick={() => selectRecipeForAddRow(recipe)} className="px-3 py-2 hover:bg-[#c9a962]/10 cursor-pointer flex items-center gap-3">
                                    {imageUrl ? (
                                      <img src={row.recipeImage} alt={recipe.recipeName} className="w-7 h-7 rounded-lg object-cover border border-[#c9a962]/20" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-[#1a1510] flex items-center justify-center text-xs">🍳</div>
                                    )}
                                    <span className="flex-1 text-sm text-white truncate">{recipe.recipeName}</span>
                                    <span className="text-xs text-[#8b7355]">₹{recipe.sellingPrice}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <input type="number" placeholder="Qty" min="0.001" step="0.001" value={addDraft.quantity}
                          onChange={(e) => setAddDraft(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-24 px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962]" />
                        <input type="number" placeholder="Rate" min="0" step="0.01" value={addDraft.rate}
                          onChange={(e) => setAddDraft(prev => ({ ...prev, rate: e.target.value }))}
                          className="w-24 px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962]" />
                        <div className="flex gap-2">
                          <button type="button" onClick={addMissingItem} className="px-4 py-2 bg-[#c9a962]/20 text-[#c9a962] text-sm font-medium rounded-lg hover:bg-[#c9a962]/30 transition-all duration-300">
                            Add row
                          </button>
                          <button type="button" onClick={() => { setShowAddRow(false); setAddDraft(emptyDraft); setAddSearchTerm('') }} className="px-4 py-2 text-[#8b7355] text-sm hover:text-white transition-colors duration-300">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-3 border-t border-[#c9a962]/10 flex flex-wrap items-center gap-4 text-xs text-[#8b7355]">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full"></span>Ready</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-400 rounded-full"></span>Needs attention</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#c9a962] rounded-full"></span>Stock checked at approval</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== NO-PDF MANUAL MODE ===================== */}
      {mode === 'manual' && (
        <div className="bg-white/5 border border-[#c9a962]/15 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#c9a962]/5 border border-[#c9a962]/15 rounded-xl">
            <svg className="w-5 h-5 text-[#c9a962] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs text-[#c5b7a2]">Use this only when there's no PDF at all for the day. If you have a PDF but it missed a few items, use the "Upload PDF" tab instead — you can add missing items there without losing the rest of the extraction.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e6dfd5] mb-1.5">Sales Date</label>
            <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)}
              className="w-full md:w-64 px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300" />
          </div>

          <div className="border-t border-[#c9a962]/10 pt-4">
            <p className="text-sm font-medium text-[#e6dfd5] mb-3">Add Items</p>
            <div className="flex flex-col gap-3">
              <div className="relative" ref={manualDropdownRef}>
                <input
                  type="text" value={manualSearchTerm}
                  onChange={(e) => { setManualSearchTerm(e.target.value); setManualDraft(prev => ({ ...prev, itemName: e.target.value })) }}
                  onFocus={() => setManualShowDropdown(true)}
                  placeholder="Search recipe or enter item name..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
                />
                {manualShowDropdown && manualSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-[#120f0c] border border-[#c9a962]/20 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredRecipesFor(manualSearchTerm).map((recipe) => {
                      const imageUrl = recipe.recipeImage ? getImageUrl(recipe.recipeImage) : null
                      return (
                        <div key={recipe._id} onClick={() => selectRecipeForManual(recipe)} className="px-4 py-2 hover:bg-[#c9a962]/10 cursor-pointer flex items-center gap-3">
                          {imageUrl ? (
                            <img src={row.recipeImage} alt={recipe.recipeName} className="w-8 h-8 rounded-lg object-cover border border-[#c9a962]/20" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#1a1510] flex items-center justify-center text-sm">🍳</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-sm font-medium block truncate">{recipe.recipeName}</span>
                            <span className="text-[#8b7355] text-xs">₹{recipe.sellingPrice}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <input type="number" value={manualDraft.quantity} onChange={(e) => setManualDraft(prev => ({ ...prev, quantity: e.target.value }))} placeholder="Qty" min="0.001" step="0.001"
                  className="flex-1 min-w-[70px] px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300" />
                <input type="number" value={manualDraft.rate} onChange={(e) => setManualDraft(prev => ({ ...prev, rate: e.target.value }))} placeholder="Rate" min="0" step="0.01"
                  className="flex-1 min-w-[70px] px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300" />
                <input type="number" value={manualDraft.discount} onChange={(e) => setManualDraft(prev => ({ ...prev, discount: e.target.value }))} placeholder="Discount" min="0" step="0.01"
                  className="flex-1 min-w-[70px] px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300" />
                <input type="number" value={manualDraft.tax} onChange={(e) => setManualDraft(prev => ({ ...prev, tax: e.target.value }))} placeholder="Tax" min="0" step="0.01"
                  className="flex-1 min-w-[70px] px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300" />
                <button type="button" onClick={addManualItem} className="px-6 py-2.5 bg-[#c9a962]/20 text-[#c9a962] font-medium rounded-xl hover:bg-[#c9a962]/30 transition-all duration-300 whitespace-nowrap">
                  {manualEditingIndex !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#8b7355]/70 mt-2">Search a recipe to auto-fill the rate, or type a free-form name. Quantity and rate are required.</p>
          </div>

          {manualItems.length > 0 && (
            <div className="mt-4 border-t border-[#c9a962]/10 pt-4">
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black/20 border-b border-[#c9a962]/10">
                      <th className="text-left text-xs font-medium text-[#8b7355] py-2 px-3">Item</th>
                      <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Qty</th>
                      <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Rate</th>
                      <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Discount</th>
                      <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Tax</th>
                      <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Total</th>
                      <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualItems.map((item, index) => {
                      const total = item.quantity * item.rate
                      return (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                          <td className="py-2 px-3 text-sm text-white">{item.itemName}</td>
                          <td className="py-2 px-3 text-sm text-[#998f82] text-right">{item.quantity}</td>
                          <td className="py-2 px-3 text-sm text-[#c9a962] text-right">{formatCurrency(item.rate)}</td>
                          <td className="py-2 px-3 text-sm text-red-400 text-right">{formatCurrency(item.discount || 0)}</td>
                          <td className="py-2 px-3 text-sm text-yellow-400 text-right">{formatCurrency(item.tax || 0)}</td>
                          <td className="py-2 px-3 text-sm text-white font-medium text-right">{formatCurrency(total)}</td>
                          <td className="py-2 px-3 text-right">
                            <button type="button" onClick={() => editManualItem(index)} className="text-[#c9a962] hover:text-[#e8d5a3] mr-2 transition-colors duration-300" title="Edit">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button type="button" onClick={() => removeManualItem(index)} className="text-red-400 hover:text-red-300 transition-colors duration-300" title="Delete">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#c9a962]/20">
                      <td colSpan="3" className="py-3 px-3"></td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-red-400">{formatCurrency(manualTotals.discount)}</td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-yellow-400">{formatCurrency(manualTotals.tax)}</td>
                      <td className="py-3 px-3 text-right text-sm font-bold text-emerald-400">{formatCurrency(manualTotals.net)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button
                type="button" onClick={handleManualSubmit} disabled={loading}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (<div className="flex items-center justify-center gap-2"><Spinner /> Processing...</div>) : `Submit Manual Sales (${manualItems.length} items)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddSales