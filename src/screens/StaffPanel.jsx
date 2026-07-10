import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import cafeLogo from '../assets/logo.jpg'
import DashboardStaff from './DashboardStaff'
import StaffCategories from './StaffCategories'
import AddCategory from './AddCategory'
import EditCategory from './EditCategory'
import StaffSubcategories from './StaffSubcategories'
import AddSubCategory from './AddSubCategory'
import EditSubCategory from './EditSubCategory'
import StaffVendors from './StaffVendors'
import AddVendor from './AddVendor'
import EditVendor from './EditVendor'
import StaffBrands from './StaffBrands'
import AddBrand from './AddBrand'
import EditBrand from './EditBrand'
import StaffIngredients from './StaffIngredients'
import AddIngredient from './AddIngredient'
import EditIngredient from './EditIngredient'
import StaffRecipes from './StaffRecipes'
import AddRecipe from './AddRecipe'
import EditRecipe from './EditRecipe'
import StaffPurchases from './StaffPurchases'
import AddPurchase from './AddPurchase'
import StaffStock from './StaffStock'
import StaffSales from './StaffSales'
import AddSales from './AddSales'

// ── Icons ──────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Categories: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="10" rx="1" />
      <rect width="7" height="5" x="3" y="14" rx="1" />
    </svg>
  ),
  Subcategories: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
      <path d="M9 6h4v7" />
    </svg>
  ),
  Recipes: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10M6 10h10" />
    </svg>
  ),
  Ingredients: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Brands: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M3.82 10.82a1.72 1.72 0 0 0 0 2.44l7 7a1.72 1.72 0 0 0 2.44 0l7.46-7.46A1.72 1.72 0 0 0 21 11.59V4a2 2 0 0 0-2-2h-7.59a1.72 1.72 0 0 0-1.23.51l-6.35 6.31zM16 8h.01" />
    </svg>
  ),
  Vendors: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Purchases: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
Sales: () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    <rect x="3" y="13" width="4" height="8" rx="1" />
    <rect x="9" y="9" width="4" height="12" rx="1" />
    <rect x="15" y="5" width="4" height="16" rx="1" />
  </svg>
),
report: () => {
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg>

},
Stock: () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="5" rx="1"/>
    <rect x="4" y="10" width="16" height="5" rx="1"  />
    <rect x="4" y="16" width="16" height="5" rx="1"  />
    <path d="M4 6.5h16M4 12.5h16M4 18.5h16"  />
  </svg>
),
  Inventory: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  ),
  MenuIcon: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
    </svg>
  ),
  Time: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

// ── Path helpers ────────────────────────────────────────────────────────────
const getEntityType = (path) => {
  if (path.includes('/subcategories')) return 'subcategory'
  if (path.includes('/recipes')) return 'recipe'
  if (path.includes('/ingredients')) return 'ingredient'
  if (path.includes('/brands')) return 'brand'
  if (path.includes('/vendors')) return 'vendor'
  if (path.includes('/stock')) return 'stock'
  if (path.includes('/purchases')) return 'purchase'
  if (path.includes('/categories')) return 'category'
  if (path.includes('/sales')) return 'sales'
  return null
}

const getAction = (path) => {
  if (path.includes('/add')) return 'add'
  if (path.includes('/edit/')) return 'edit'
  return 'list'
}

// ── StaffPanel ──────────────────────────────────────────────────────────────
const StaffPanel = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Default active tab is now 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Dropdown states
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [salesOpen, setSalesOpen] = useState(false)

  useEffect(() => {
    try {
      const user = localStorage.getItem('user')
      if (user) setCurrentUser(JSON.parse(user))
    } catch {
      setCurrentUser(null)
    }
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, activeTab])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    navigate('/login', { replace: true })
  }

  // Helper: change tab and close mobile menu
  const handleTabChange = (id) => {
    setActiveTab(id)
    setMobileMenuOpen(false)
  }

  const menuSections = [
    {
      id: 'inventory',
      label: 'Inventory Management',
      icon: Icons.Inventory,
      isOpen: inventoryOpen,
      toggle: () => setInventoryOpen(!inventoryOpen),
      items: [
        { id: 'categories', label: 'Categories', icon: Icons.Categories },
        { id: 'subcategories', label: 'Subcategories', icon: Icons.Subcategories },
        { id: 'vendors', label: 'Vendors', icon: Icons.Vendors },
        { id: 'stock', label: 'Stock', icon: Icons.Stock }, 


      ]
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: Icons.Recipes,
      isOpen: menuOpen,
      toggle: () => setMenuOpen(!menuOpen),
      items: [
        { id: 'ingredients', label: 'Ingredients', icon: Icons.Ingredients },
        { id: 'recipes', label: 'Recipes', icon: Icons.Recipes },
        { id: 'brands', label: 'Brands', icon: Icons.Brands },
      ]
    },
    {
      id: 'sales',
      label: 'Sales Management',
      icon: Icons.Sales,
      isOpen: salesOpen,
      toggle: () => setSalesOpen(!salesOpen),
      items: [
        { id: 'purchases', label: 'Purchases', icon: Icons.Purchases },
        { id: 'sales', label: 'Sales Report', icon: Icons.Sales },
      ]
    }
  ]

  // ── Page label ─────────────────────────────────────────────────────────────
  const getCurrentLabel = () => {
    const path = location.pathname
    const entity = getEntityType(path)
    const action = getAction(path)

    if (entity && action === 'add') return `Add ${entity.charAt(0).toUpperCase() + entity.slice(1)}`
    if (entity && action === 'edit') return `Edit ${entity.charAt(0).toUpperCase() + entity.slice(1)}`

    if (activeTab === 'dashboard') return 'Dashboard'

    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.id === activeTab) return item.label
      }
    }
    return 'Dashboard'
  }

  // ── Content renderer ───────────────────────────────────────────────────────
  const renderContent = () => {
    try {
      const path = location.pathname
      const entity = getEntityType(path)
      const action = getAction(path)

      if (action === 'add') {
        switch (entity) {
          case 'category':    
            return <AddCategory />
          case 'subcategory': 
            return <AddSubCategory />
          case 'vendor': 
            return <AddVendor />
          case 'brand': 
            return <AddBrand />
          case 'ingredient':
             return <AddIngredient />
          case 'recipe':
             return <AddRecipe />
          case 'purchase':
             return <AddPurchase />
          case 'sales':
               return <AddSales />
          default:            
             return <AddCategory />
        }
      }

      if (action === 'edit') {
        const id = path.split('/edit/')[1]
        switch (entity) {
          case 'category':    
            return <EditCategory id={id} />
          case 'subcategory': 
            return <EditSubCategory id={id} />
          case 'vendor':      
            return <EditVendor id={id} />
          case 'brand':
            return <EditBrand id={id} />
          case 'ingredient':
            return <EditIngredient id={id} />
           case 'recipe':
                return <EditRecipe id={id} />
          default:            
            return <EditCategory id={id} />
        }
      }

      switch (activeTab) {
        case 'dashboard':
          return <DashboardStaff onNavigate={handleTabChange} />
        case 'categories':
          return <StaffCategories />
        case 'subcategories':
          return <StaffSubcategories />
        case 'vendors':
          return <StaffVendors />
        case 'stock':
            return <StaffStock />
        case 'ingredients':
           return <StaffIngredients />
        case 'brands':
          return <StaffBrands />
        case 'recipes':
          return <StaffRecipes />
        case 'purchases':
          return <StaffPurchases />
        case 'sales':
               return <StaffSales />
        default:
          return <DashboardStaff onNavigate={handleTabChange} />
      }
    } catch (error) {
      console.error('Render error:', error)
      return (
        <div className="text-center py-12 text-red-400">
          <p className="text-lg">Error loading component</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      )
    }
  }

  // ── Sidebar inner content (shared between desktop + mobile drawer) ──────────
  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#c9a962]/10 shrink-0">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-[#c9a962]/10 blur-xl rounded-full" />
            <img
              src={cafeLogo}
              alt="Logo"
              className="relative w-10 h-10 rounded-xl border border-[#c9a962]/30 object-cover shadow-lg shadow-[#c9a962]/20"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-['Playfair_Display',serif] text-lg ms-1 mt-2 font-bold text-white tracking-wide leading-tight">
                   PRAJAIAN'S
              </span>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[6px] font-semibold text-[#c9a962] tracking-[0.2em] uppercase bg-[#c9a962]/8 px-2 py-0.5 rounded-full border border-[#c9a962]/15">
                  Resto Cafe
                </span>
                <span className="text-[6px] font-semibold text-[#c9a962] tracking-[0.2em] uppercase bg-[#c9a962]/8 px-2 py-0.5 rounded-full border border-[#c9a962]/15">
                  Since 2023
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:block text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300 ml-1"
        >
          <Icons.ChevronLeft />
        </button>

        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300"
        >
          <Icons.Close />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">

          {/* ── Dashboard link (first, standalone) ── */}
          <button
            type="button"
            onClick={() => handleTabChange('dashboard')}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
              transition-all duration-300
              ${activeTab === 'dashboard'
                ? 'bg-[#c9a962]/10 text-[#e8d5a3] border border-[#c9a962]/20'
                : 'text-[#998f82] hover:text-[#e6dfd5] hover:bg-white/5'
              }
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <span className="text-[#c9a962]"><Icons.Dashboard /></span>
            {!sidebarCollapsed && (
              <>
                <span className="text-xs font-semibold flex-1 text-left">Dashboard</span>
                {activeTab === 'dashboard' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
                )}
              </>
            )}
          </button>

          {/* Divider */}
          {!sidebarCollapsed && (
            <div className="pt-1 pb-2 px-2">
              <div className="h-px bg-[#c9a962]/8" />
            </div>
          )}

          {/* ── Grouped sections ── */}
          {menuSections.map((section) => {
            const IconComponent = section.icon
            const isOpen = section.isOpen

            return (
              <div key={section.id} className="space-y-0.5">
                {/* Section Header */}
                <button
                  type="button"
                  onClick={section.toggle}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                    transition-all duration-300
                    text-[#998f82] hover:text-[#e6dfd5] hover:bg-white/5
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <span className="text-[#c9a962]"><IconComponent /></span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-xs font-medium flex-1 text-left capitalize">
                        {section.label}
                      </span>
                      <span className="text-[#8b7355]">
                        {isOpen ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                      </span>
                    </>
                  )}
                </button>

                {/* Section Items */}
                {isOpen && !sidebarCollapsed && (
                  <div className="ml-6 space-y-0.5 border-l border-[#c9a962]/10 pl-2">
                    {section.items.map((item) => {
                      const ItemIcon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabChange(item.id)}
                          className={`
                            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                            transition-all duration-300 text-sm
                            ${isActive
                              ? 'bg-[#c9a962]/10 text-[#e8d5a3] border border-[#c9a962]/20'
                              : 'text-[#998f82] hover:text-[#e6dfd5] hover:bg-white/5'
                            }
                          `}
                        >
                          <span className="text-[#c9a962]"><ItemIcon /></span>
                          <span className="font-medium">{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c9a962]" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      {!sidebarCollapsed && currentUser && (
        <div className="shrink-0 px-4 py-3 border-t border-[#c9a962]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#c9a962]/20 border border-[#c9a962]/30 flex items-center justify-center text-[#c9a962] text-xs font-bold shrink-0">
              {(currentUser.name || currentUser.email || 'S')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#e6dfd5]/25 truncate">
                {currentUser.name || currentUser.staff.email}
              </p>
              <p className="text-[10px] text-[#8b7355]/45 capitalize">User: {currentUser.role}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0a0805] flex font-['Inter',sans-serif] overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`
          hidden md:flex h-full bg-[#070604] border-r border-[#c9a962]/15
          flex-col flex-shrink-0 transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          w-[280px] bg-[#070604] border-r border-[#c9a962]/15
          transition-transform duration-300 ease-in-out
          md:hidden
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Navbar */}
        <header className="sticky top-0 z-30 bg-[#0a0805]/80 backdrop-blur-xl border-b border-[#c9a962]/20 px-4 py-3 flex items-center justify-between shrink-0">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#e6dfd5] hover:text-[#c9a962] transition-colors duration-300 shrink-0"
            >
              <Icons.MenuIcon />
            </button>

            <h1 className="text-base sm:text-lg font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold truncate">
              {getCurrentLabel()}
            </h1>
            <span className="hidden sm:inline-block text-xs text-[#8b7355] font-mono tracking-wider bg-white/5 px-3 py-1 rounded-full border border-[#c9a962]/10 shrink-0">
              Staff Panel
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8b7355]">
              <Icons.Time />
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300 p-1.5 rounded-lg hover:bg-white/5"
              title="Go to Home"
            >
              <Icons.Home />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-lg text-[#f43f5e] hover:bg-[#f43f5e]/20 transition-all duration-300 text-sm font-medium"
            >
              <Icons.Logout />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default StaffPanel