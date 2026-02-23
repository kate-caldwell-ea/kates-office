import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import { API_URL } from '../config.js'
import { PWAInstallPrompt, PWAInstalledBanner } from './PWAInstallPrompt'
import {
  LayoutDashboard,
  KanbanSquare,
  Receipt,
  Shield,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
  Clock,
  HelpCircle,
  Heart,
  Plane,
  Settings,
  ChevronRight,
  Wallet,
  Cpu,
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
  { name: 'AI Usage', href: '/ai-usage', icon: Cpu },
  { name: 'Security', href: '/security', icon: ShieldAlert },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Mobile bottom nav — iOS-style, 5 tabs
const mobileNav = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/assignments', icon: KanbanSquare },
  { name: 'Family', href: '/family', icon: Heart },
  { name: 'Money', href: '/expenses', icon: Wallet },
  { name: 'More', href: '/settings', icon: Menu },
]

export default function Layout() {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useStore()
  const [kateStatus, setKateStatus] = useState({ message: 'Ready to help', icon: '✨' })
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) closeSidebar()
  }, [location, isMobile, closeSidebar])

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
    <div className="min-h-screen bg-dark-900 flex flex-col md:flex-row">
      <PWAInstallPrompt />
      <PWAInstalledBanner />

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop + mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-dark-800 border-r border-dark-300/30 transition-all duration-300 ${
          isMobile
            ? sidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full w-72'
            : sidebarOpen ? 'w-64' : 'w-[72px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-dark-300/30">
          <div className={`flex items-center gap-3 ${!sidebarOpen && !isMobile && 'justify-center w-full'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-dark-900" />
            </div>
            {(sidebarOpen || isMobile) && (
              <div>
                <h1 className="font-semibold text-text-100 text-sm">Kate's Office</h1>
                <p className="text-[10px] text-text-500">Executive Assistant</p>
              </div>
            )}
          </div>
          {(sidebarOpen || isMobile) && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-dark-500 text-text-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-400'
                    : 'text-text-400 hover:bg-dark-500/50 hover:text-text-200'
                } ${!sidebarOpen && !isMobile && 'justify-center'}`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {(sidebarOpen || isMobile) && (
                <>
                  <span className="text-sm">{item.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Kate Status in sidebar footer */}
        {(sidebarOpen || isMobile) && (
          <div className="px-4 py-3 border-t border-dark-300/30">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-dark-800" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-300 font-medium">Kate is online</p>
                <p className="text-[10px] text-text-500 truncate">{kateStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse button (desktop collapsed) */}
        {!sidebarOpen && !isMobile && (
          <div className="px-3 py-3 border-t border-dark-300/30">
            <button
              onClick={toggleSidebar}
              className="w-full p-2 rounded-xl hover:bg-dark-500/50 text-text-500 flex justify-center"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 pb-20 md:pb-0 ${
          isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-[72px]'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-12 md:h-14 bg-dark-900/80 backdrop-blur-xl border-b border-dark-300/20 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 -ml-1 rounded-lg hover:bg-dark-500/50 text-text-400"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {!isMobile && !sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-dark-500/50 text-text-400 mr-2"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Kate Status pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-dark-600/60 border border-dark-300/30">
              <div className="relative">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" />
              </div>
              <span className="text-xs text-text-300 hidden sm:inline">
                Kate — {(kateStatus.message || 'ready').toLowerCase()}
              </span>
              <span className="text-xs sm:hidden text-text-400">{kateStatus.icon || '✨'}</span>
            </div>
          </div>

          {/* Page title on mobile */}
          {isMobile && (
            <span className="text-text-300 text-sm font-medium">
              {navigation.find(n => n.href === location.pathname)?.name || 'Kate\'s Office'}
            </span>
          )}

          <div className="flex items-center gap-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-dark-500 text-gold-400' : 'hover:bg-dark-500/50 text-text-500'
                }`
              }
            >
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar — iOS style */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-800/95 backdrop-blur-xl border-t border-dark-300/20 px-2 safe-area-bottom">
          <div className="flex items-center justify-around py-1">
            {mobileNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all touch-manipulation ${
                    isActive
                      ? 'text-gold-400'
                      : 'text-text-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <item.icon className="w-5 h-5" />
                      {isActive && (
                        <motion.div
                          layoutId="bottomTabIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-400"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
