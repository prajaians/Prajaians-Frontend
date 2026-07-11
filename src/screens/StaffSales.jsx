import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const LOGO_URL = 'https://res.cloudinary.com/mddemz67/image/upload/v1783761419/logo_ixcv2j.jpg'

const StaffSales = () => {
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  // Per-sale line items cache
  const [detailsCache, setDetailsCache] = useState({})
  const [detailsLoadingId, setDetailsLoadingId] = useState(null)
  const [detailsError, setDetailsError] = useState({})

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [filterStaff, setFilterStaff] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Ingredients for image display
  const [ingredients, setIngredients] = useState([])

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
       return imagePath

  }

  // Fetch ingredients
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

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/summary`, { headers: { token } })
      if (response.data.status === 'SUCCESS') setSummary(response.data.data)
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  const fetchSales = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/viewAll?page=1&limit=500`, { headers: { token } })
      if (response.data.status === 'SUCCESS') {
        setSales(response.data.data.sales || [])
      } else {
        setError(response.data.message || 'Failed to fetch sales')
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.status === 401 ? 'Session expired. Please login again.' : (err.response.data?.message || 'Error fetching sales'))
      } else if (err.request) {
        setError('Unable to connect to server. Please check your network.')
      } else {
        setError('Failed to fetch sales. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchSales() 
    fetchSummary()
    fetchIngredients()
  }, [])

  // ---- Lazy-load line items ----
  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (detailsCache[id]) return

    setDetailsLoadingId(id)
    setDetailsError(prev => ({ ...prev, [id]: '' }))
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/details/${id}`, { headers: { token } })
      if (response.data.status === 'SUCCESS') {
        // Fetch recipe images for items
        const items = response.data.data.items || []
        const itemsWithImages = items.map(item => {
          if (item.recipeId && item.recipeId.recipeImage) {
            return {
              ...item,
              recipeImage: item.recipeId.recipeImage
            }
          }
          return item
        })
        setDetailsCache(prev => ({ ...prev, [id]: itemsWithImages }))
      } else {
        setDetailsError(prev => ({ ...prev, [id]: response.data.message || 'Failed to load items' }))
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load items for this sale'
      setDetailsError(prev => ({ ...prev, [id]: message }))
    } finally {
      setDetailsLoadingId(null)
    }
  }

  // ---- Filter option lists ----
  const availableYears = useMemo(() => {
    const years = new Set(sales.map(s => new Date(s.salesDate).getFullYear()).filter(y => !isNaN(y)))
    return Array.from(years).sort((a, b) => b - a)
  }, [sales])

  const availableStaff = useMemo(() => {
    const names = new Set(
      sales.map(s => s.processedBy?.staff?.name || s.processedBy?.name).filter(Boolean)
    )
    return Array.from(names).sort()
  }, [sales])

  const filteredSales = useMemo(() => {
    let filtered = sales

    if (filterDate) {
      const target = new Date(filterDate)
      filtered = filtered.filter(s => {
        const d = new Date(s.salesDate)
        return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate()
      })
    } else {
      if (filterMonth !== 'all') {
        filtered = filtered.filter(s => new Date(s.salesDate).getMonth() === Number(filterMonth))
      }
      if (filterYear !== 'all') {
        filtered = filtered.filter(s => new Date(s.salesDate).getFullYear() === Number(filterYear))
      }
    }

    if (filterStaff !== 'all') {
      filtered = filtered.filter(s => (s.processedBy?.staff?.name || s.processedBy?.name) === filterStaff)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s => {
        const saleId = s._id?.slice(-8) || ''
        const staffName = (s.processedBy?.staff?.name || s.processedBy?.name || '').toLowerCase()
        const pdfName = (s.pdfFileName || '').toLowerCase()
        const dateStr = new Date(s.salesDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()
        return saleId.includes(term) || staffName.includes(term) || pdfName.includes(term) || dateStr.includes(term)
      })
    }

    return filtered
  }, [sales, searchTerm, filterDate, filterMonth, filterYear, filterStaff])

  const activeFilterCount = [filterDate, filterMonth !== 'all', filterYear !== 'all', filterStaff !== 'all'].filter(Boolean).length

  const clearFilters = () => {
    setSearchTerm('')
    setFilterDate('')
    setFilterMonth('all')
    setFilterYear('all')
    setFilterStaff('all')
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // FIX: the PDF now lives on Cloudinary (see sales.services.js -> approveSalesPDF,
  // which uploads via uploadPdfToCloudinary and saves the result as pdfFilePath,
  // then deletes the local copy). Previously this rebuilt a URL against the
  // Railway backend's local /sales static folder using pdfFileName, which
  // 404s because that local file no longer exists (and Railway's disk is
  // ephemeral anyway). pdfFilePath already IS the full, working Cloudinary URL.
  const getPdfUrl = (sale) => sale?.pdfFilePath || null

  const isRealPdf = (sale) => sale.pdfFileName && !sale.pdfFileName.startsWith('manual_')

  const handleAddSales = () => navigate('/staffPanel/sales/add')

  // ---- Generate Sales Report HTML for Print/PDF with Dynamic Page Numbers ----
  const generateSalesHTML = (sale, items, totalPages = 1, currentPage = 1) => {
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

    // Build items HTML with images
    let itemsHTML = ''
    items.forEach((item, index) => {
      const recipeImage = item.recipeImage || null
      const imageUrl = recipeImage ? getImageUrl(recipeImage) : null
      
      itemsHTML += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-size: 13px; color: #4b5563; text-align: center; width: 5%;">${index + 1}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1f2937; width: 28%;">
            ${imageUrl ? `<img src="${imageUrl}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db; margin-right: 10px; vertical-align: middle;" />` : ''}
            ${item.pdfItemName || 'N/A'}
            ${item.recipeId?.recipeName ? `<span style="display:block;font-size:11px;color:#6b7280;margin-top:2px;">${item.recipeId.recipeName}</span>` : ''}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1f2937; text-align: right; width: 8%;">${item.quantity || 0}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1f2937; text-align: right; width: 10%;">${formatCurrency(item.pdfRate || 0)}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1f2937; text-align: right; width: 12%;">${formatCurrency(item.grossRevenue || 0)}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #ef4444; text-align: right; width: 10%;">${formatCurrency(item.discountAmount || 0)}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #eab308; text-align: right; width: 10%;">${formatCurrency(item.taxAmount || 0)}</td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #1f2937; text-align: right; width: 12%;">${formatCurrency(item.netRevenue || 0)}</td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: ${(item.profit || 0) > 0 ? '#059669' : '#dc2626'}; text-align: right; width: 10%;">${formatCurrency(item.profit || 0)}</td>
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
            max-width: 1200px;
            margin: 0 auto;
          }
          .print-container { 
            background: white; 
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
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
          .report-title span { color: #c9a962; }
          .report-divider { border: none; border-top: 2px solid #c9a962; margin-top: 11px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; margin-bottom: 16px; }
          .header-left { display: flex; align-items: center; gap: 16px; }
          .logo { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid #d1d5db; }
          .brand-name { font-size: 15px; font-weight: 700; color: #1f2937; font-family: 'Playfair Display', serif; }
          .brand-sub { font-size: 13px; color: #6b7280; }
          .header-right { text-align: right; }
          .header-right p { font-size: 13px; color: #6b7280; margin: 2px 0; }
          .header-right span { font-weight: 600; color: #1f2937; }
          
          .content-area { flex: 1; }
          .table-container { margin-bottom: 24px; overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; }
          thead { background: #1f2937; color: white; }
          th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          th.text-right { text-align: right; }
          th.text-center { text-align: center; }
          td { padding: 10px 12px; font-size: 13px; }
          td.text-right { text-align: right; }
          td.text-center { text-align: center; }
          
          .grand-total { border-top: 2px solid #d1d5db; font-weight: 700; }
          .grand-total td { padding: 12px; font-size: 16px; }
          .grand-total .total-label { text-align: right; color: #1f2937; }
          .grand-total .total-value { text-align: right; color: #1f2937; font-size: 18px; }
          
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .summary-box h4 { font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
          .summary-row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
          .summary-row .label { color: #6b7280; }
          .summary-row .value { font-weight: 600; color: #1f2937; }
          
          .footer { border-top: 2px solid #d1d5db; padding-top: 16px; margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .signature-area { width: 200px; }
          .signature-area h4 { font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .signature-line { width: 100%; height: 1px; border-bottom: 2px solid #9ca3af; margin-top: 8px; }
          .signature-sub { font-size: 10px; color: #9ca3af; margin-top: 4px; }
          .footer-right { text-align: right; }
          .footer-right p { font-size: 13px; color: #1f2937; margin: 2px 0; }
          .footer-right .small { font-size: 11px; color: #6b7280; }
          
          .page-number { 
            text-align: center; 
            font-size: 11px; 
            color: #9ca3af; 
            margin-top: 20px; 
            padding-top: 10px; 
            border-top: 1px solid #e5e7eb;
          }
          
          .no-items { text-align: center; padding: 30px; color: #9ca3af; }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            @page { 
              size: A4; 
              margin: 10mm;
              @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
              }
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="report-title-wrapper">
            <div class="report-title">SALES <span>REPORT</span></div>
            <hr class="report-divider" />
          </div>

          <div class="header">
            <div class="header-left">
           <img src="${LOGO_URL}" alt="Logo" class="logo" />

            <div>
                <div class="brand-name"> PRAJAIAN'S Resto-Cafe</div>
                <div class="brand-sub">Sale #${sale._id?.slice(-8) || 'N/A'}</div>
              </div>
            </div>
            <div class="header-right">
              <p>Sale ID: <span>${sale._id?.slice(-8) || 'N/A'}</span></p>
              <p>Date: <span>${formatDate(sale.salesDate)}</span></p>
              <p>Time: <span>${getTimestamp()}</span></p>
            </div>
          </div>

          <div class="content-area">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="text-align:center;width:5%;">#</th>
                    <th style="width:28%;">Item</th>
                    <th style="text-align:right;width:8%;">Qty</th>
                    <th style="text-align:right;width:10%;">Rate</th>
                    <th style="text-align:right;width:12%;">Gross</th>
                    <th style="text-align:right;width:10%;">Discount</th>
                    <th style="text-align:right;width:10%;">Tax</th>
                    <th style="text-align:right;width:12%;">Net</th>
                    <th style="text-align:right;width:10%;">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML || '<tr><td colspan="9" class="no-items">No items found</td></tr>'}
                </tbody>
                <tfoot>
                  <tr class="grand-total">
                    <td colspan="4" class="total-label">Grand Total:</td>
                    <td class="total-value">${formatCurrency(sale.totalNetRevenue || 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="summary-grid">
              <div class="summary-box">
                <h4>Summary</h4>
                <div class="summary-row"><span class="label">Total Items:</span><span class="value">${sale.totalItems || 0}</span></div>
                <div class="summary-row"><span class="label">Total Gross:</span><span class="value">${formatCurrency(sale.totalGrossRevenue || 0)}</span></div>
                <div class="summary-row"><span class="label">Total Discount:</span><span class="value">${formatCurrency(sale.totalDiscount || 0)}</span></div>
                <div class="summary-row"><span class="label">Total Tax:</span><span class="value">${formatCurrency(sale.totalTax || 0)}</span></div>
                <div class="summary-row"><span class="label">Total Net Revenue:</span><span class="value">${formatCurrency(sale.totalNetRevenue || 0)}</span></div>
                <div class="summary-row"><span class="label">Total Profit:</span><span class="value">${formatCurrency(sale.totalProfit || 0)}</span></div>
              </div>
              <div class="summary-box">
                <h4>Information</h4>
                <div class="summary-row"><span class="label">Processed By:</span><span class="value">${sale.processedBy?.staff?.name || sale.processedBy?.name || 'System'}</span></div>
                <div class="summary-row"><span class="label">Stock Deduction:</span><span class="value">FIFO</span></div>
                ${sale.pdfFileName ? `<div class="summary-row"><span class="label">Source:</span><span class="value">${isRealPdf(sale) ? 'PDF Upload' : 'Manual Entry'}</span></div>` : ''}
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

          <div class="page-number">Page ${currentPage} of ${totalPages} | Generated on ${getTimestamp()}</div>
        </div>
      </body>
      </html>
    `
  }

  // ---- Print ----
  const handlePrint = (sale) => {
    const items = detailsCache[sale._id] || []
    const htmlContent = generateSalesHTML(sale, items, 1, 1)
    const printWindow = window.open('', '_blank', 'width=1100,height=900')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => printWindow.print(), 500)
    } else {
      alert('Please allow popups to print')
    }
  }

  // ---- Export PDF ----
  const handleExportPDF = async (sale) => {
    const items = detailsCache[sale._id] || []
    if (!sale || items.length === 0) {
      setError('No data to export')
      return
    }

    setError('')
    try {
      const htmlContent = generateSalesHTML(sale, items, 1, 1)
      const container = document.createElement('div')
      container.innerHTML = htmlContent
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '1200px'
      container.style.background = 'white'
      document.body.appendChild(container)

      const printElement = container.querySelector('.print-container')
      if (!printElement) throw new Error('Could not find print content')

      // Count pages
      const pageHeight = 297 // A4 height in mm
      const contentHeight = printElement.scrollHeight * 0.264583 // px to mm approximation
      const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeight))

      // Regenerate HTML with page count
      const updatedHTML = generateSalesHTML(sale, items, totalPages, 1)
      container.innerHTML = updatedHTML
      const updatedElement = container.querySelector('.print-container')

      const opt = {
        margin: 10,
        filename: `sales_${sale._id?.slice(-8) || 'order'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      await html2pdf().set(opt).from(updatedElement).save()
      document.body.removeChild(container)
    } catch (err) {
      console.error('PDF generation error:', err)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  // ---- Export Individual Excel ----
  const handleExportExcel = (sale) => {
    const items = detailsCache[sale._id] || []
    if (!sale || items.length === 0) {
      setError('No data to export')
      return
    }

    let csvContent = 'S.No,Item Name,Recipe,Quantity,Rate (₹),Gross (₹),Discount (₹),Tax (₹),Net (₹),Profit (₹)\n'
    
    items.forEach((item, index) => {
      const recipeName = item.recipeId?.recipeName || ''
      csvContent += `${index + 1},"${item.pdfItemName || 'N/A'}","${recipeName}",${item.quantity || 0},${item.pdfRate || 0},${item.grossRevenue || 0},${item.discountAmount || 0},${item.taxAmount || 0},${item.netRevenue || 0},${item.profit || 0}\n`
    })

    csvContent += `\n"Total Items",${items.length}\n`
    csvContent += `"Total Net Revenue",${sale.totalNetRevenue || 0}\n`
    csvContent += `"Total Profit",${sale.totalProfit || 0}\n`
    csvContent += `"Processed By","${sale.processedBy?.staff?.name || sale.processedBy?.name || 'System'}"\n`
    csvContent += `"Date","${formatDate(sale.salesDate)}"\n`

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sales_${sale._id?.slice(-8) || 'order'}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ---- Export All Sales to Excel ----
  const handleExportAllExcel = async () => {
    if (filteredSales.length === 0) {
      setError('No data to export')
      return
    }

    // Fetch all details first
    const allDetails = {}
    for (const sale of filteredSales) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/sales/details/${sale._id}`, { headers: { token } })
        if (response.data.status === 'SUCCESS') {
          allDetails[sale._id] = response.data.data.items || []
        }
      } catch (err) {
        console.error('Error fetching details for', sale._id, err)
      }
    }

    let csvContent = '=== SALES REPORT ===\n'
    csvContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`
    csvContent += `Total Sales: ${filteredSales.length}\n\n`

    csvContent += '=== SALES SUMMARY ===\n'
    csvContent += 'S.No,Sale ID,Date,Items,Net Revenue (₹),Profit (₹),Processed By,Source\n'
    
    filteredSales.forEach((sale, index) => {
      const source = isRealPdf(sale) ? 'PDF' : 'Manual'
      csvContent += `${index + 1},"${sale._id?.slice(-8) || 'N/A'}","${formatDate(sale.salesDate)}",${sale.totalItems || 0},${sale.totalNetRevenue || 0},${sale.totalProfit || 0},"${sale.processedBy?.staff?.name || sale.processedBy?.name || 'System'}","${source}"\n`
    })

    csvContent += `\n\n=== DETAILED ITEMS ===\n`
    csvContent += 'Sale ID,Item Name,Recipe,Quantity,Rate (₹),Gross (₹),Discount (₹),Tax (₹),Net (₹),Profit (₹)\n'
    
    filteredSales.forEach((sale) => {
      const items = allDetails[sale._id] || []
      items.forEach((item) => {
        const recipeName = item.recipeId?.recipeName || ''
        csvContent += `"${sale._id?.slice(-8) || 'N/A'}","${item.pdfItemName || 'N/A'}","${recipeName}",${item.quantity || 0},${item.pdfRate || 0},${item.grossRevenue || 0},${item.discountAmount || 0},${item.taxAmount || 0},${item.netRevenue || 0},${item.profit || 0}\n`
      })
    })

    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalNetRevenue || 0), 0)
    const totalProfit = filteredSales.reduce((sum, s) => sum + (s.totalProfit || 0), 0)
    const totalItems = filteredSales.reduce((sum, s) => sum + (s.totalItems || 0), 0)

    csvContent += `\n\n=== SUMMARY STATISTICS ===\n`
    csvContent += `"Total Sales",${filteredSales.length}\n`
    csvContent += `"Total Items",${totalItems}\n`
    csvContent += `"Total Revenue (₹)",${totalRevenue}\n`
    csvContent += `"Total Profit (₹)",${totalProfit}\n`

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sales_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold">Sales Management</h2>
          <p className="text-sm text-[#998f82] mt-1">View and manage your sales</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportAllExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-green-500/30 text-green-400 font-bold text-sm rounded-xl hover:bg-green-500/10 transition-all duration-300 cursor-pointer"
            title="Export all sales to Excel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All
          </button>
          <button
            type="button" onClick={handleAddSales}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Sales
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-[#c9a962]/10 to-[#9a7b4f]/10 border border-[#c9a962]/20 rounded-xl p-4 text-center hover:border-[#c9a962]/40 transition-all duration-300">
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.today?.revenue || 0)}</p>
            <p className="text-xs text-[#8b7355] mt-1 uppercase tracking-wider">Today's Revenue</p>
          </div>
          <div className="bg-gradient-to-br from-[#c9a962]/10 to-[#9a7b4f]/10 border border-[#c9a962]/20 rounded-xl p-4 text-center hover:border-[#c9a962]/40 transition-all duration-300">
            <p className="text-2xl font-bold text-[#c9a962]">{formatCurrency(summary.today?.profit || 0)}</p>
            <p className="text-xs text-[#8b7355] mt-1 uppercase tracking-wider">Today's Profit</p>
          </div>
          <div className="bg-gradient-to-br from-[#c9a962]/10 to-[#9a7b4f]/10 border border-[#c9a962]/20 rounded-xl p-4 text-center hover:border-[#c9a962]/40 transition-all duration-300">
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.week?.revenue || 0)}</p>
            <p className="text-xs text-[#8b7355] mt-1 uppercase tracking-wider">This Week</p>
          </div>
          <div className="bg-gradient-to-br from-[#c9a962]/10 to-[#9a7b4f]/10 border border-[#c9a962]/20 rounded-xl p-4 text-center hover:border-[#c9a962]/40 transition-all duration-300">
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.month?.revenue || 0)}</p>
            <p className="text-xs text-[#8b7355] mt-1 uppercase tracking-wider">This Month</p>
          </div>
          <div className="bg-gradient-to-br from-[#c9a962]/10 to-[#9a7b4f]/10 border border-[#c9a962]/20 rounded-xl p-4 text-center hover:border-[#c9a962]/40 transition-all duration-300">
            <p className="text-2xl font-bold text-white">{summary.today?.items || 0}</p>
            <p className="text-xs text-[#8b7355] mt-1 uppercase tracking-wider">Items Today</p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white/5 border border-[#c9a962]/15 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-[#8b7355] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by sale ID, staff, PDF file, or date..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-[#c9a962]/15 rounded-xl text-white placeholder-[#998f82]/50 text-sm focus:outline-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-all duration-300"
            />
          </div>
          <button
            type="button" onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 whitespace-nowrap ${
              showFilters || activeFilterCount > 0 ? 'bg-[#c9a962]/15 border-[#c9a962]/40 text-[#c9a962]' : 'bg-white/5 border-[#c9a962]/15 text-[#998f82] hover:text-[#c5b7a2]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          {(activeFilterCount > 0 || searchTerm) && (
            <button type="button" onClick={clearFilters} className="px-4 py-2.5 text-sm text-[#8b7355] hover:text-white transition-colors duration-300 whitespace-nowrap">
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-[#c9a962]/10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-[#8b7355] uppercase tracking-wider mb-1">Exact Date</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962]" />
            </div>
            <div>
              <label className="block text-[10px] text-[#8b7355] uppercase tracking-wider mb-1">Month</label>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} disabled={!!filterDate} className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] disabled:opacity-40">
                <option value="all" className='bg-black/50'>All Months</option>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i} className='bg-black' >{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#8b7355] uppercase tracking-wider mb-1">Year</label>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} disabled={!!filterDate} className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962] disabled:opacity-40">
                <option value="all" className='bg-black/50'>All Years</option>
                {availableYears.map(y => <option key={y} value={y} className='bg-black' >{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#8b7355] uppercase tracking-wider mb-1">Staff</label>
              <select value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-[#c9a962]/15 rounded-lg text-white text-sm focus:outline-none focus:border-[#c9a962]">
                <option value="all" className='bg-black/50'>All Staff</option>
                {availableStaff.map(name => <option key={name} value={name} className='bg-black' >{name} </option>)}
              </select>
            </div>
            {filterDate && (
              <p className="col-span-2 md:col-span-4 text-[11px] text-[#8b7355]">Exact date overrides month/year - clear it to use those instead.</p>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-[#8b7355]">{filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} found</p>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-8 h-8 animate-spin text-[#c9a962]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-[#c9a962]/15 rounded-2xl">
          <svg className="w-12 h-12 text-[#8b7355]/40 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <p className="text-[#998f82]">{sales.length === 0 ? 'No sales recorded yet.' : 'No sales match your filters.'}</p>
          {sales.length === 0 ? (
            <button type="button" onClick={handleAddSales} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#c9a962] to-[#9a7b4f] text-[#0a0805] font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-[#c9a962]/25 transition-all duration-300">
              Add Sale
            </button>
          ) : (
            <button type="button" onClick={clearFilters} className="mt-4 text-sm text-[#c9a962] hover:text-[#e8d5a3] transition-colors duration-300">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSales.map((sale) => {
            const isExpanded = expandedId === sale._id
            const items = detailsCache[sale._id] || []
            const isLoadingDetails = detailsLoadingId === sale._id
            const detailError = detailsError[sale._id]
            const pdfUrl = getPdfUrl(sale)
            const source = isRealPdf(sale) ? 'PDF' : 'Manual'

            return (
              <div key={sale._id} className="bg-white/5 border border-[#c9a962]/15 rounded-xl overflow-hidden hover:border-[#c9a962]/30 transition-all duration-300">
                {/* Sale Header */}
                <div className="p-5 cursor-pointer hover:bg-white/5 transition-colors duration-200" onClick={() => toggleExpand(sale._id)}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-['Playfair_Display',serif] text-white font-semibold">
                          Sale #{sale._id?.slice(-8) || 'N/A'}
                        </h3>
                        <span className="text-xs font-medium px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{formatDate(sale.salesDate)}</span>
                        <span className={`text-xs font-medium px-3 py-0.5 rounded-full border ${source === 'PDF' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                          {source}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
                        <span className="text-sm text-emerald-400 font-semibold">Revenue: {formatCurrency(sale.totalNetRevenue || 0)}</span>
                        <span className={`text-sm font-semibold ${(sale.totalProfit || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>Profit: {formatCurrency(sale.totalProfit || 0)}</span>
                        <span className="text-sm text-[#998f82]">{sale.totalItems || 0} items</span>
                        <span className="text-xs text-[#8b7355]">By {sale.processedBy?.staff?.name || sale.processedBy?.name || 'System'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center mt-2 md:mt-0">
                      {/* View PDF Button */}
                      {isRealPdf(sale) && pdfUrl && (
                        <a
                          href={pdfUrl} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a962]/10 border border-[#c9a962]/25 text-[#c9a962] text-xs font-medium rounded-lg hover:bg-[#c9a962]/20 transition-all duration-300"
                          title="View PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                           Uploaded PDF
                        </a>
                      )}

                      {/* Print Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handlePrint(sale) }}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-[#c9a962] hover:bg-[#c9a962]/10 rounded-lg border border-[#c9a962]/20 transition-all duration-300 cursor-pointer"
                        title="Print Report"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>

                      {/* Export PDF Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleExportPDF(sale) }}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/30 transition-all duration-300 cursor-pointer"
                        title="Download PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3v6h6" />
                        </svg>
                        PDF
                      </button>

                      {/* Export Excel Button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleExportExcel(sale) }}
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
                        onClick={(e) => { e.stopPropagation(); toggleExpand(sale._id) }}
                        className="flex items-center gap-1 text-xs text-[#8b7355] hover:text-[#c5b7a2] transition-colors duration-300"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="border-t border-[#c9a962]/10 p-5">
                    {isLoadingDetails ? (
                      <div className="flex items-center justify-center py-8 gap-3 text-[#8b7355]">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading items...
                      </div>
                    ) : detailError ? (
                      <div className="text-center py-6 text-red-400 text-sm">{detailError}</div>
                    ) : items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#c9a962]/10">
                              <th className="text-left text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Item</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Qty</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Rate</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Gross</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Discount</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Tax</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Net</th>
                              <th className="text-right text-xs font-medium text-[#8b7355] py-2 px-3 uppercase tracking-wider">Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => {
                              const recipeImage = item.recipeImage || item.recipeId?.recipeImage || null
                              const imageUrl = recipeImage ? getImageUrl(recipeImage) : null
                              
                              return (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200">
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      {imageUrl ? (
                                        <img src={imageUrl} alt={item.pdfItemName} className="w-7 h-7 rounded-lg object-cover border border-[#c9a962]/20 flex-shrink-0" />
                                      ) : (
                                        <div className="w-7 h-7 rounded-lg bg-[#1a1510] flex items-center justify-center text-xs text-[#8b7355] flex-shrink-0">🍽️</div>
                                      )}
                                      <div>
                                        <span className="text-sm text-white">{item.pdfItemName || 'Unknown'}</span>
                                        {item.recipeId?.recipeName && (
                                          <span className="text-xs text-[#8b7355] block">({item.recipeId.recipeName})</span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-sm text-[#998f82] text-right">{item.quantity || 0}</td>
                                  <td className="py-2.5 px-3 text-sm text-[#c9a962] text-right">{formatCurrency(item.pdfRate || 0)}</td>
                                  <td className="py-2.5 px-3 text-sm text-[#998f82] text-right">{formatCurrency(item.grossRevenue || 0)}</td>
                                  <td className="py-2.5 px-3 text-sm text-red-400 text-right">{formatCurrency(item.discountAmount || 0)}</td>
                                  <td className="py-2.5 px-3 text-sm text-yellow-400 text-right">{formatCurrency(item.taxAmount || 0)}</td>
                                  <td className="py-2.5 px-3 text-sm text-white font-medium text-right">{formatCurrency(item.netRevenue || 0)}</td>
                                  <td className={`py-2.5 px-3 text-sm font-medium text-right ${(item.profit || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(item.profit || 0)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-[#c9a962]/20">
                              <td colSpan="4" className="py-3 px-3"></td>
                              <td className="py-3 px-3 text-right text-sm font-semibold text-white">Total Discount:</td>
                              <td className="py-3 px-3 text-right text-sm font-semibold text-white">{formatCurrency(sale.totalDiscount || 0)}</td>
                            </tr>
                            <tr className="border-t border-[#c9a962]/20">
                              <td colSpan="4" className="py-3 px-3"></td>
                              <td className="py-3 px-3 text-right text-sm font-semibold text-white">Total Tax:</td>
                              <td className="py-3 px-3 text-right text-sm font-semibold text-white">{formatCurrency(sale.totalTax || 0)}</td>
                            </tr>
                            <tr className="border-t-2 border-[#c9a962]/30 bg-[#c9a962]/5">
                              <td colSpan="4" className="py-3 px-3"></td>
                              <td className="py-3 px-3 text-right text-sm font-semibold text-[#c9a962]">Net Revenue:</td>
                              <td className="py-3 px-3 text-right text-sm font-bold text-emerald-400">{formatCurrency(sale.totalNetRevenue || 0)}</td>
                            </tr>
                            <tr className="border-t border-[#c9a962]/20">
                              <td colSpan="4" className="py-3 px-3"></td>
                              <td className="py-3 px-3 text-right text-sm font-semibold text-[#c9a962]">Total Profit:</td>
                              <td className={`py-3 px-3 text-right text-sm font-bold ${(sale.totalProfit || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(sale.totalProfit || 0)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-[#8b7355] py-4">No items found for this sale</p>
                    )}

                    <div className="mt-4 pt-3 border-t border-[#c9a962]/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        <span className="text-xs text-[#8b7355]">Stock Deducted via FIFO</span>
                      </div>
                      <span className="text-xs text-[#8b7355]">Processed by: {sale.processedBy?.staff?.name || sale.processedBy?.name || 'System'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StaffSales