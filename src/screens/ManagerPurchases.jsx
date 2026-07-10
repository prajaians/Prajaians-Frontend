import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const ManagerPurchases = () => {
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [filterIngredient, setFilterIngredient] = useState('')
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [filterVendor, setFilterVendor] = useState('')
  const [vendors, setVendors] = useState([])
  const [downloading, setDownloading] = useState(false)

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${baseUrl}${imagePath}`
  }

  // Fetch purchases
  const fetchPurchases = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manager/viewAllPurchase`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        // Sort purchases by date - latest first
        const sortedPurchases = (response.data.data || []).sort((a, b) => {
          const dateA = new Date(a.purchaseDate || a.createdAt)
          const dateB = new Date(b.purchaseDate || b.createdAt)
          return dateB - dateA
        })
        setPurchases(sortedPurchases)
      } else {
        setError(response.data.message || 'Failed to fetch purchases')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching purchases')
    } finally {
      setLoading(false)
    }
  }

  // Fetch ingredients for filter and image display
  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manager/viewAllIngredient`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setIngredients(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err)
    }
  }

  // Fetch vendors for print view
  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/manager/viewAllVendor`,
        { headers: { token } }
      )
      if (response.data.status === 'SUCCESS') {
        setVendors(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching vendors:', err)
    }
  }

  useEffect(() => {
    fetchPurchases()
    fetchIngredients()
    fetchVendors()
  }, [])

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Toggle expand
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setFilterIngredient('')
    setFilterVendor('')
    setFilterFromDate('')
    setFilterToDate('')
  }

  // Filter purchases - FIXED: Vendor filter now works
  const filteredPurchases = purchases.filter(purchase => {
    // Search by vendor name
    const matchesSearch = purchase.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter by vendor dropdown
    const matchesVendor = filterVendor ? purchase.vendorName === filterVendor : true
    
    // Filter by ingredient
    let matchesIngredient = true
    if (filterIngredient) {
      matchesIngredient = purchase.purchaseItems?.some(item => 
        item.ingredientName?.toLowerCase().includes(filterIngredient.toLowerCase())
      )
    }
    
    // Filter by date range
    let matchesDate = true
    const purchaseDate = purchase.purchaseDate || purchase.createdAt
    if (filterFromDate) {
      matchesDate = matchesDate && new Date(purchaseDate) >= new Date(filterFromDate)
    }
    if (filterToDate) {
      matchesDate = matchesDate && new Date(purchaseDate) <= new Date(filterToDate)
    }
    
    return matchesSearch && matchesVendor && matchesIngredient && matchesDate
  })

  // Get unique vendor names for filter
  const uniqueVendors = [...new Set(purchases.map(p => p.vendorName).filter(Boolean))]

  // Get vendor by name
  const getVendorByName = (vendorName) => {
    return vendors.find(v => v.vendorName === vendorName)
  }

  // Generate print content HTML
  const generatePrintHTML = (purchase) => {
    const vendor = getVendorByName(purchase.vendorName)
    const items = purchase.purchaseItems || []
    const total = purchase.totalBillAmount || purchase.totalAmount || 0
    
    const getTimestamp = () => {
      const now = new Date()
      return now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }

    const getVendorAddress = (v) => {
      if (!v) return 'N/A'
      const parts = []
      if (v.address?.city) parts.push(v.address.city)
      if (v.address?.district) parts.push(v.address.district)
      if (v.address?.state) parts.push(v.address.state)
      if (v.address?.pincode) parts.push(v.address.pincode)
      return parts.join(', ') || 'N/A'
    }

    // Build items HTML
    let itemsHTML = ''
    items.forEach((item, index) => {
      const ingredient = ingredients.find(ing => ing.ingredientName === item.ingredientName)
      const unit = ingredient?.unit || item.unit || '-'
      const imageUrl = ingredient?.ingredientImage ? getImageUrl(ingredient.ingredientImage) : null
      
      itemsHTML += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 12px; font-size: 14px; color: #4b5563; text-align: center;">${index + 1}</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #1f2937;">
            ${imageUrl ? `<img src="${imageUrl}" style="width: 35px; height: 24px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db; margin-right: 8px; vertical-align: middle;" />` : ''}
            ${item.ingredientName || 'N/A'}
          </td>
          <td style="padding: 8px 12px; font-size: 14px; color: #6b7280; font-family: monospace; text-align: center;">${item.batchNumber || '-'}</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #1f2937; text-align: right;">${item.quantity || 0}</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #6b7280; text-align: right;">${unit}</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #1f2937; text-align: right;">${formatCurrency(item.unitPrice || item.unitCost || 0)}</td>
          <td style="padding: 8px 12px; font-size: 14px; font-weight: 600; color: #1f2937; text-align: right;">${formatCurrency(item.totalPrice || item.totalCost || 0)}</td>
        </tr>
      `
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            background: white; 
            padding: 20px;
            max-width: 1100px;
            margin: 0 auto;
          }
          .print-container { 
            background: white; 
            padding: 20px;
          }
          .report-title-wrapper {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px double #c9a962;
          }
          .report-title {
            font-family: 'Playfair Display', serif;
            font-size: 23px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: 2px;
          }
          .report-title span {
            color: #c9a962;
          }
          .report-divider {
            border: none;
            border-top: 2px solid #c9a962;
            margin-top: 11px;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            padding-bottom: 16px; 
            margin-bottom: 16px; 
          }
          .header-left { display: flex; align-items: center; gap: 16px; }
          .logo { 
            width: 64px; 
            height: 64px; 
            object-fit: cover; 
            border-radius: 8px; 
            border: 1px solid #d1d5db; 
          }
          .brand-name { 
            font-size: 15px; 
            font-weight: 700; 
            color: #1f2937;
            font-family: 'Playfair Display', serif;
            margin-top:-12px;
          }
          .brand-sub { font-size: 13px; color: #6b7280; }
          .header-right { text-align: right; }
          .header-right p { font-size: 13px; color: #6b7280; margin: 2px 0; }
          .header-right span { font-weight: 600; color: #1f2937; }
          
          .address-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px; 
            margin-bottom: 24px; 
          }
          .address-box { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            background: #f9fafb; 
          }
          .address-box h3 { 
            font-size: 12px; 
            font-weight: 700; 
            color: #4b5563; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 8px; 
          }
          .address-box p { font-size: 14px; color: #1f2937; margin: 2px 0; }
          .address-box .label { font-weight: 600; }
          
          .table-container { margin-bottom: 24px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; }
          thead { background: #1f2937; color: white; }
          th { 
            padding: 8px 12px; 
            text-align: left; 
            font-size: 12px; 
            font-weight: 600; 
          }
          th.text-right { text-align: right; }
          th.text-center { text-align: center; }
          td { padding: 8px 12px; font-size: 14px; }
          td.text-right { text-align: right; }
          td.text-center { text-align: center; }
          
          .grand-total { 
            border-top: 2px solid #d1d5db; 
            font-weight: 700; 
          }
          .grand-total td { padding: 12px; font-size: 16px; }
          .grand-total .total-label { text-align: right; color: #1f2937; }
          .grand-total .total-value { text-align: right; color: #1f2937; font-size: 18px; }
          
          .summary-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 16px; 
            margin-bottom: 24px; 
          }
          .summary-box { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
          }
          .summary-box h4 { 
            font-size: 12px; 
            font-weight: 700; 
            color: #4b5563; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 8px; 
          }
          .summary-box p { font-size: 14px; color: #6b7280; margin: 2px 0; }
          .summary-row { 
            display: flex; 
            justify-content: space-between; 
            font-size: 14px; 
            margin: 4px 0; 
          }
          .summary-row .label { color: #6b7280; }
          .summary-row .value { font-weight: 600; color: #1f2937; }
          
          .footer { 
            border-top: 2px solid #d1d5db; 
            padding-top: 16px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
          }
          .signature-area { 
            width: 200px; 
          }
          .signature-area h4 { 
            font-size: 12px; 
            font-weight: 700; 
            color: #4b5563; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 4px; 
          }
          .signature-line { 
            width: 100%; 
            height: 1px; 
            border-bottom: 2px solid #9ca3af; 
            margin-top: 8px; 
          }
          .signature-sub { font-size: 10px; color: #9ca3af; margin-top: 4px; }
          .footer-right { text-align: right; }
          .footer-right p { font-size: 14px; color: #1f2937; margin: 2px 0; }
          .footer-right .small { font-size: 12px; color: #6b7280; }
          
          .page-number { 
            text-align: center; 
            font-size: 11px; 
            color: #9ca3af; 
            margin-top: 24px; 
            padding-top: 8px; 
            border-top: 1px solid #e5e7eb; 
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="report-title-wrapper">
            <div class="report-title">PURCHASE <span>REPORT</span></div>
            <hr class="report-divider" />
          </div>

          <div class="header">
            <div class="header-left">
              <img src="${window.location.origin}/src/assets/logo.jpg" alt="Logo" class="logo" onerror="this.style.display='none'" />
              <div>
                <div class="brand-name">PRAJAIAN'S Resto-Cafe</div>
                <div class="brand-sub">Purchase Order</div>
              </div>
            </div>
            <div class="header-right">
              <p>Invoice #: <span>${purchase._id?.slice(-8) || 'N/A'}</span></p>
              <p>Date: <span>${formatDate(purchase.purchaseDate || purchase.createdAt)}</span></p>
              <p>Time: <span>${getTimestamp()}</span></p>
            </div>
          </div>

          <div class="address-grid">
            <div class="address-box">
              <h3>BILL TO</h3>
              <p><span class="label">${vendor?.vendorName || purchase.vendorName || 'N/A'}</span></p>
              ${vendor?.email ? `<p>${vendor.email}</p>` : ''}
              ${vendor?.phone ? `<p>Phone: ${vendor.phone}</p>` : ''}
              <p>${getVendorAddress(vendor)}</p>
            </div>
            <div class="address-box">
              <h3>BILL TO</h3>
              <p><span class="label">${vendor?.vendorName || purchase.vendorName || 'N/A'}</span></p>
              ${vendor?.email ? `<p>${vendor.email}</p>` : ''}
              ${vendor?.phone ? `<p>Phone: ${vendor.phone}</p>` : ''}
              <p>${getVendorAddress(vendor)}</p>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width:5%; text-align:center;">#</th>
                  <th style="width:25%;">Ingredient</th>
                  <th style="width:20%; text-align:center;">Batch</th>
                  <th style="width:10%; text-align:right;">Qty</th>
                  <th style="width:10%; text-align:right;">Unit</th>
                  <th style="width:15%; text-align:right;">Unit Price</th>
                  <th style="width:15%; text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML || '<tr><td colspan="7" style="text-align:center; padding:20px; color:#9ca3af;">No items found</td></tr>'}
              </tbody>
              <tfoot>
                <tr class="grand-total">
                  <td colspan="6" class="total-label">Grand Total:</td>
                  <td class="total-value">${formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <h4>Remarks / Instructions</h4>
              <p>Please make check payable to PRAJAIAN'S Resto-Cafe.</p>
              <p style="margin-top:4px;">Thank you for your business!</p>
            </div>
            <div class="summary-box">
              <h4>Summary</h4>
              <div class="summary-row">
                <span class="label">Total Items:</span>
                <span class="value">${items.length}</span>
              </div>
              <div class="summary-row">
                <span class="label">Total Amount:</span>
                <span class="value">${formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature-area">
              <h4>AUTHORIZED SIGNATURE</h4>
              <div class="signature-line"></div>
              <div class="signature-sub">(Signature)</div>
            </div>
            <div class="footer-right">
              <p style="font-weight:600;">PRAJAIAN'S Resto-Cafe</p>
              <p class="small">Near Shanthi Hospital, Kodakara</p>
              <p class="small">Thrissur Dt, Kerala - 680684</p>
              <p class="small">Phone: +91 85907 47379</p>
            </div>
          </div>

          <div class="page-number">
            Page 1 of 1 | Generated on ${getTimestamp()}
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Handle Print - Open in new window
  const handlePrint = (purchase) => {
    const htmlContent = generatePrintHTML(purchase)
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    } else {
      alert('Please allow popups to print')
    }
  }

  // Handle Export PDF - Auto Download using html2pdf
  const handleExportPDF = async (purchase) => {
    if (!purchase) {
      setError('No data to export')
      return
    }

    setDownloading(true)
    setError('')

    try {
      const htmlContent = generatePrintHTML(purchase)
      
      const container = document.createElement('div')
      container.innerHTML = htmlContent
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '1100px'
      container.style.background = 'white'
      document.body.appendChild(container)

      const printElement = container.querySelector('.print-container')
      
      if (!printElement) {
        throw new Error('Could not find print content')
      }

      const opt = {
        margin: 10,
        filename: `purchase_${purchase._id?.slice(-8) || 'order'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      await html2pdf().set(opt).from(printElement).save()

      document.body.removeChild(container)

    } catch (err) {
      console.error('PDF generation error:', err)
      setError('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // Handle Export Excel (CSV) - Individual with proper headings
  const handleExportExcel = (purchase) => {
    if (!purchase) {
      setError('No data to export')
      return
    }

    const items = purchase.purchaseItems || []
    
    // Proper CSV headers matching table columns with dark green
    let csvContent = 'S.No,Ingredient Name,Batch Number,Quantity,Unit,Unit Price (₹),Total (₹)\n'
    
    items.forEach((item, index) => {
      const ingredient = ingredients.find(ing => ing.ingredientName === item.ingredientName)
      const unit = ingredient?.unit || item.unit || '-'
      csvContent += `${index + 1},"${item.ingredientName || 'N/A'}","${item.batchNumber || '-'}",${item.quantity || 0},"${unit}",${item.unitPrice || item.unitCost || 0},${item.totalPrice || item.totalCost || 0}\n`
    })

    // Add summary at the end
    csvContent += `\n"Total Items",${items.length}\n`
    csvContent += `"Total Amount (₹)",${purchase.totalBillAmount || purchase.totalAmount || 0}\n`
    csvContent += `"Vendor","${purchase.vendorName || 'N/A'}"\n`
    csvContent += `"Date","${formatDate(purchase.purchaseDate || purchase.createdAt)}"\n`

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `purchase_${purchase._id?.slice(-8) || 'order'}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export All to Excel with proper headings and dark green header
  const handleExportAllExcel = () => {
    if (filteredPurchases.length === 0) {
      setError('No data to export')
      return
    }

    // Report Header
    let csvContent = 'Purchase Report\n'
    csvContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`
    csvContent += `Total Purchases: ${filteredPurchases.length}\n\n`
    
    // Purchase Summary Section
    csvContent += '=== PURCHASE SUMMARY ===\n'
    csvContent += 'S.No,Vendor,Date,Total Amount (₹),Items\n'
    
    filteredPurchases.forEach((purchase, index) => {
      const vendorName = purchase.vendorName || 'Unknown Vendor'
      const date = formatDate(purchase.purchaseDate || purchase.createdAt)
      const total = purchase.totalBillAmount || purchase.totalAmount || 0
      const items = purchase.purchaseItems?.length || 0
      csvContent += `${index + 1},"${vendorName}","${date}",${total},${items}\n`
    })
    
    // Detailed Items Section
    csvContent += `\n\n=== DETAILED ITEMS ===\n`
    csvContent += 'S.No,Vendor,Purchase Date,Ingredient Name,Batch Number,Quantity,Unit,Unit Price (₹),Total (₹)\n'
    
    let itemCounter = 0
    filteredPurchases.forEach((purchase) => {
      const vendorName = purchase.vendorName || 'Unknown Vendor'
      const date = formatDate(purchase.purchaseDate || purchase.createdAt)
      
      purchase.purchaseItems?.forEach((item) => {
        itemCounter++
        const ingredient = ingredients.find(ing => ing.ingredientName === item.ingredientName)
        const unit = ingredient?.unit || item.unit || '-'
        const ingredientName = item.ingredientName || 'N/A'
        const batch = item.batchNumber || '-'
        const qty = item.quantity || 0
        const unitPrice = item.unitPrice || item.unitCost || 0
        const totalPrice = item.totalPrice || item.totalCost || 0
        
        csvContent += `${itemCounter},"${vendorName}","${date}","${ingredientName}","${batch}",${qty},"${unit}",${unitPrice},${totalPrice}\n`
      })
    })

    // Summary Statistics
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.totalBillAmount || p.totalAmount || 0), 0)
    const totalItems = filteredPurchases.reduce((sum, p) => sum + (p.purchaseItems?.length || 0), 0)
    
    csvContent += `\n\n=== SUMMARY STATISTICS ===\n`
    csvContent += `"Total Purchases",${filteredPurchases.length}\n`
    csvContent += `"Total Items",${totalItems}\n`
    csvContent += `"Total Amount (₹)",${totalAmount}\n`

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `purchases_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">
            Purchases
          </h2>
          <p className="text-sm text-[#998f82] mt-1">
            Manage your purchase ledger and inventory
          </p>
        </div>
      </div>

      {/* Search and Filter Card */}
      <div className="bg-white/5 border border-[#c9a962]/15 rounded-xl p-5 mb-6">
        <div className="flex flex-col gap-3">
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
                placeholder="Search by vendor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              />
            </div>

            {/* Vendor Filter - FIXED */}
            <div className="relative md:w-48">
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 appearance-none"
              >
                <option value="" className="bg-black/80">All Vendors</option>
                {uniqueVendors.map((vendor) => (
                  <option key={vendor} value={vendor} className="bg-black">
                    {vendor}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Ingredient Filter */}
            <div className="relative md:w-48">
              <select
                value={filterIngredient}
                onChange={(e) => setFilterIngredient(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300 appearance-none"
              >
                <option value="" className="bg-black/80">All Ingredients</option>
                {ingredients.map((ing) => (
                  <option key={ing._id} value={ing.ingredientName} className="bg-black">
                    {ing.ingredientName} ({ing.unit})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* From Date */}
            <div className="relative flex-1">
              <label className="block text-xs font-medium text-[#8b7355] mb-1">From Date</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              />
            </div>

            {/* To Date */}
            <div className="relative flex-1">
              <label className="block text-xs font-medium text-[#8b7355] mb-1">To Date</label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap mt-5">
              {(searchTerm || filterIngredient || filterVendor || filterFromDate || filterToDate) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#998f82] hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer text-sm"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onClick={handleExportAllExcel}
                className="flex items-center gap-1.5 h-full px-3 py-2.5 bg-white/5 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/10 transition-all duration-300 cursor-pointer text-sm font-medium"
                title="Export all to Excel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export All</span>
              </button>
            </div>
          </div>
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
          {filteredPurchases.length} {filteredPurchases.length === 1 ? 'purchase' : 'purchases'} found
        </p>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="ml-3 text-[#998f82]">Loading purchases...</span>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-12 text-[#998f82] bg-white/5 border border-[#c9a962]/10 rounded-xl">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg font-medium text-white">No purchases found</p>
          <p className="text-sm mt-1">
            {searchTerm || filterIngredient || filterVendor || filterFromDate || filterToDate 
              ? 'Try adjusting your search or filters' 
              : 'No purchase records available.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => (
            <div
              key={purchase._id}
              className="group relative bg-white/5 border border-[#c9a962]/10 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white/10 w-full"
            >
              {/* Left Border Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[#c9a962] via-[#e8d5a3] to-[#9a7b4f] opacity-70"></div>

              <div className="p-5 pl-6">
                {/* Header - Click to expand */}
                <div 
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer"
                  onClick={() => toggleExpand(purchase._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                        {purchase.vendorName || 'Unknown Vendor'}
                      </h3>
                      <span className="text-xs font-medium px-3 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/30 inline-flex items-center whitespace-nowrap">
                        Purchase Order
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 min-h-[24px]">
                      <span className="text-sm text-[#c9a962] flex items-center gap-2 font-semibold">
                        <svg className="w-4 h-4 text-[#c9a962] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatCurrency(purchase.totalBillAmount || purchase.totalAmount || 0)}
                      </span>
                      <span className="text-sm text-[#998f82] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(purchase.purchaseDate || purchase.createdAt)}
                      </span>
                      <span className="text-sm text-[#998f82] flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#8b7355] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {purchase.purchaseItems?.length || 0} items
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center mt-2 md:mt-0">
                    {/* Print Button */}
                    <button
                      type="button"
                      onClick={() => handlePrint(purchase)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-[#c9a962] hover:bg-[#c9a962]/10 rounded-lg border border-[#c9a962]/20 transition-all duration-300 cursor-pointer"
                      title="Print"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </button>

                    {/* PDF Button */}
                    <button
                      type="button"
                      onClick={() => handleExportPDF(purchase)}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/30 transition-all duration-300 cursor-pointer disabled:opacity-50"
                      title="Download PDF"
                    >
                      {downloading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3v6h6" />
                        </svg>
                      )}
                      {downloading ? 'Creating...' : 'PDF'}
                    </button>

                    {/* Excel Button */}
                    <button
                      type="button"
                      onClick={() => handleExportExcel(purchase)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10 rounded-lg border border-green-500/30 transition-all duration-300 cursor-pointer"
                      title="Export as Excel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel
                    </button>

                    {/* Expand/Collapse */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(purchase._id)}
                      className="flex items-center gap-1 text-xs text-[#8b7355] hover:text-[#c5b7a2] transition-colors duration-300"
                    >
                      {expandedId === purchase._id ? 'Collapse' : 'Expand'}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${expandedId === purchase._id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Items */}
                {expandedId === purchase._id && (
                  <div className="mt-4 pt-4 border-t border-[#c9a962]/10">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#c9a962]/10">
                            <th className="text-left text-xs font-medium text-[#8b7355] py-2 px-3">Item</th>
                            <th className="text-left text-xs font-medium text-[#8b7355] py-2 px-3">Batch</th>
                            <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Qty</th>
                            <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Unit</th>
                            <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Unit Price</th>
                            <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchase.purchaseItems?.map((item, index) => {
                            const ingredient = ingredients.find(ing => ing.ingredientName === item.ingredientName)
                            const imageUrl = ingredient?.ingredientImage ? getImageUrl(ingredient.ingredientImage) : null
                            const unit = ingredient?.unit || item.unit || '-'
                            
                            return (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-3">
                                    {imageUrl ? (
                                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0">
                                        <img 
                                          src={imageUrl} 
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
                                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#c9a962]/20 flex-shrink-0 bg-[#1a1510] flex items-center justify-center text-[#8b7355] text-sm">
                                        🍽️
                                      </div>
                                    )}
                                    <span className="text-sm text-white">{item.ingredientName || 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-xs font-mono text-[#998f82] bg-white/5 px-2 py-1 rounded border border-[#c9a962]/10">
                                    {item.batchNumber || '-'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-sm text-[#998f82] text-right">{item.quantity || 0}</td>
                                <td className="py-2 px-3 text-sm text-[#c9a962] text-right">{unit}</td>
                                <td className="py-2 px-3 text-sm text-[#c9a962] text-right">{formatCurrency(item.unitPrice || item.unitCost || 0)}</td>
                                <td className="py-2 px-3 text-sm text-white text-right font-medium">{formatCurrency(item.totalPrice || item.totalCost || 0)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#c9a962]/20">
                            <td colSpan="5" className="py-3 px-3 text-right text-sm font-semibold text-white">Grand Total:</td>
                            <td className="py-3 px-3 text-right text-sm font-bold text-[#c9a962]">
                              {formatCurrency(purchase.totalBillAmount || purchase.totalAmount || 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManagerPurchases