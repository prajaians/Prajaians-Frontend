    import { useState, useEffect } from 'react'
    import { useNavigate } from 'react-router-dom'
    import cafeLogo from '../assets/logo.jpg'

    // Admin Components
    import AdminDashboard from './AdminDashboard'
    import AdminStaff from './AdminStaff'
    import AdminManagers from './AdminManagers'

    // ── Icons ────────────────────────────────────────────────────────────────
    const Icons = {
    Dashboard: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="10" rx="1" />
        <rect width="7" height="5" x="3" y="14" rx="1" />
        </svg>
    ),
    Staff: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Managers: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M18 8h2a2 2 0 0 1 2 2v4" />
        <path d="M10 17v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Logout: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    ),
    Menu: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    Home: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
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
    Time: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Pulse: () => (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h4l2-8 4 16 2-8h6" />
        </svg>
    ),
    }

    const AdminPanel = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        try {
        const user = localStorage.getItem('user')
        if (user) setCurrentUser(JSON.parse(user))
        } catch {
        setCurrentUser(null)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userRole')
        navigate('/login', { replace: true })
    }

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
        { id: 'staff', label: 'Staff Management', icon: Icons.Staff },
        { id: 'managers', label: 'Manager Management', icon: Icons.Managers },
    ]

    // Render active component
    const renderContent = () => {
        try {
        switch (activeTab) {
            case 'dashboard':
            return <AdminDashboard currentUser={currentUser} />
            case 'staff':
            return <AdminStaff />
            case 'managers':
            return <AdminManagers />
            default:
            return <AdminDashboard currentUser={currentUser} />
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

    const getCurrentLabel = () => {
        const found = menuItems.find(item => item.id === activeTab)
        return found?.label || 'Dashboard'
    }

    // Sidebar Content
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
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[7px] font-semibold text-[#c9a962] tracking-[0.2em] uppercase bg-[#c9a962]/8 px-2 py-0.5 rounded-full border border-[#c9a962]/15">
                    Control Deck
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                </div>
                </div>
            )}
            </div>
            <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:block text-[#8b7355] hover:text-[#c9a962] transition-colors duration-300"
            >
            <Icons.ChevronLeft />
            </button>
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
            <div className="space-y-1.5">
            {menuItems.map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                    }}
                    className={`
                    relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                    transition-all duration-300 group
                    ${isActive
                        ? 'bg-[#c9a962]/10 text-[#e8d5a3] border border-[#c9a962]/25 shadow-[0_0_20px_-6px_rgba(201,169,98,0.3)]'
                        : 'text-[#998f82] hover:text-[#e6dfd5] hover:bg-white/5 border border-transparent'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                >
                    {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#c9a962] shadow-[0_0_10px_2px_rgba(201,169,98,0.4)]" />}
                    <span className={`relative shrink-0 ${isActive ? 'text-[#c9a962]' : 'text-[#8b7355] group-hover:text-[#c9a962]'} transition-colors duration-300`}>
                    <IconComponent />
                    </span>
                    {!sidebarCollapsed && (
                    <>
                        <span className="text-xs font-semibold flex-1 text-left">{item.label}</span>
                        {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a962] animate-pulse" />
                        )}
                    </>
                    )}
                </button>
                )
            })}
            </div>
        </nav>

        {/* User footer */}
        {!sidebarCollapsed && currentUser && (
            <div className="shrink-0 px-4 py-3 border-t border-[#c9a962]/10">
            <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-[#c9a962]/20 border border-[#c9a962]/30 flex items-center justify-center text-[#c9a962] text-xs font-bold shrink-0">
                {(currentUser.name || currentUser.email || 'A')[0].toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#070604] animate-pulse" />
                </div>
                <div className="min-w-0">
                <p className="text-xs font-medium text-[#e6dfd5] truncate">
                    {currentUser.name || currentUser.admin?.name || 'Admin'}
                </p>
                </div>
            </div>
            </div>
        )}
        </>
    )

    return (
        <div className="h-screen bg-[#0a0805] flex font-['Inter',sans-serif] overflow-hidden">

        {/* Ambient background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNjOWE5NjIiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#c9a962]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Desktop Sidebar */}
        <aside
            className={`
            relative hidden md:flex h-full bg-[#070604]/95 backdrop-blur-xl border-r border-[#c9a962]/15
            flex-col flex-shrink-0 transition-all duration-300 ease-in-out z-10
            ${sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'}
            `}
        >
            <SidebarContent />
        </aside>

        {/* Mobile Sidebar Drawer */}
        <aside
            className={`
            fixed inset-y-0 left-0 z-50 flex flex-col
            w-[280px] bg-[#070604]/98 backdrop-blur-xl border-r border-[#c9a962]/15
            transition-transform duration-300 ease-in-out
            md:hidden
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <SidebarContent />
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
            <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            />
        )}

        {/* Main Content */}
        <div className="relative flex-1 flex flex-col h-full overflow-hidden min-w-0 z-10">

            {/* Navbar */}
            <header className="sticky top-0 z-30 bg-[#0a0805]/80 backdrop-blur-xl border-b border-[#c9a962]/20 px-4 py-3 flex items-center justify-between shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#e6dfd5] hover:text-[#c9a962] transition-colors duration-300 shrink-0"
                >
                <Icons.Menu />
                </button>

                <h1 className="text-base sm:text-lg font-['Playfair_Display',serif] text-[#e8d5a3] font-semibold truncate">
                Admin Panel
                </h1>
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#8b7355] tracking-wider bg-white/5 px-3 py-1 rounded-full border border-[#c9a962]/10 shrink-0 uppercase">
                <Icons.Pulse />
                {getCurrentLabel()}
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
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-lg text-[#f43f5e] hover:bg-[#f43f5e]/20 hover:shadow-[0_0_20px_-6px_rgba(244,63,94,0.4)] transition-all duration-300 text-sm font-medium"
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

    export default AdminPanel