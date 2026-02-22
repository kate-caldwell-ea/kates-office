import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import { API_URL } from '../config.js'
import {
  LayoutDashboard,
  KanbanSquare,
  Receipt,
  Shield,
  ShieldAlert,
  MessageCircle,
  Menu,
  X,
  Coffee,
  Flower2,
  Frame,
  Sparkles,
  Clock,
  HelpCircle,
  Heart,
  Plane,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assignments', href: '/assignments', icon: KanbanSquare },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Questions', href: '/questions', icon: HelpCircle },
  { name: 'Family', href: '/family', icon: Heart },
  { name: 'Travel', href: '/travel', icon: Plane },
  { name: 'Cron Jobs', href: '/cron', icon: Clock },
  { name: 'QAPI', href: '/qapi', icon: Shield },
  { name: 'Security', href: '/security', icon: ShieldAlert },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
]

// Mobile bottom nav (most important items)
const mobileNav = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/assignments', icon: KanbanSquare },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Money', href: '/expenses', icon: Receipt },
  { name: 'More', href: '/qapi', icon: Menu },
]

export default function Layout() {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useStore()
  const [kateStatus, setKateStatus] = useState({ message: 'Ready to help', icon: '✨' })
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      closeSidebar()
    }
  }, [location, isMobile, closeSidebar])

  // Fetch Kate's status
  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${API_URL}/kate/status`)
        .then(res => res.json())
        .then(setKateStatus)
        .catch(() => {})
    }
    
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col md:flex-row">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-cream-200 transition-all duration-300 ${
          isMobile 
            ? sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64'
            : sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-cream-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && !isMobile && 'justify-center w-full'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {(sidebarOpen || isMobile) && (
              <div>
                <h1 className="font-semibold text-warm-800">Kate's Office</h1>
                <p className="text-xs text-warm-500">Personal Assistant</p>
              </div>
            )}
          </div>
          {(sidebarOpen || isMobile) && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-cream-100 text-warm-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-sage-100 text-sage-700 font-medium'
                    : 'text-warm-600 hover:bg-cream-100 hover:text-warm-800'
                } ${!sidebarOpen && !isMobile && 'justify-center'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(sidebarOpen || isMobile) && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Decorative Elements */}
        {(sidebarOpen || isMobile) && (
          <div className="px-4 py-4 border-t border-cream-200">
            <div className="flex items-center gap-3 text-warm-400">
              <div className="flex items-center gap-1">
                <Flower2 className="w-4 h-4 text-sage-400" />
                <span className="text-xs">Desk buddy</span>
              </div>
              <div className="flex items-center gap-1">
                <Coffee className="w-4 h-4 text-rose-gold-400" />
                <span className="text-xs">Fueled</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-cream-100 border border-cream-200 flex items-center justify-center">
                <Frame className="w-4 h-4 text-warm-400" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-cream-100 border border-cream-200 flex items-center justify-center">
                <Frame className="w-4 h-4 text-warm-400" />
              </div>
            </div>
          </div>
        )}

        {/* Collapse button (when collapsed on desktop) */}
        {!sidebarOpen && !isMobile && (
          <div className="px-3 py-4 border-t border-cream-200">
            <button
              onClick={toggleSidebar}
              className="w-full p-2.5 rounded-xl hover:bg-cream-100 text-warm-500 flex justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 pb-20 md:pb-0 ${
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-14 md:h-16 bg-cream-50/80 backdrop-blur-sm border-b border-cream-200 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 -ml-2 rounded-lg hover:bg-cream-100 text-warm-500"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {!isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-cream-100 text-warm-500 mr-2"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Kate Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sage-50 border border-sage-100">
              <div className="relative">
                <Sparkles className="w-4 h-4 text-sage-500" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />
              </div>
              <span className="text-sm text-sage-700 hidden sm:inline">
                Kate is {kateStatus.message.toLowerCase()}
              </span>
              <span className="text-sm sm:hidden">{kateStatus.icon}</span>
            </div>
          </div>

          {/* Page title on mobile */}
          {isMobile && (
            <span className="text-warm-600 font-medium">
              {navigation.find(n => n.href === location.pathname)?.name || 'Kate\'s Office'}
            </span>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/chat"
              className={({ isActive }) => 
                `p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-sage-100 text-sage-700' : 'hover:bg-cream-100 text-warm-500'
                }`
              }
            >
              <MessageCircle className="w-5 h-5" />
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-cream-200 px-2 py-1 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {mobileNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-sage-600'
                      : 'text-warm-400'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
