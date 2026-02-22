import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import useAuthStore from '../store/useAuthStore'
import CommandPalette from './CommandPalette'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import {
  LayoutDashboard,
  KanbanSquare,
  Receipt,
  Shield,
  MessageCircle,
  Menu,
  X,
  Coffee,
  Flower2,
  Frame,
  Sparkles,
  Clock,
  HelpCircle,
  LogOut,
  Search,
  Command,
  Calendar,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assignments', href: '/assignments', icon: KanbanSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Questions', href: '/questions', icon: HelpCircle },
  { name: 'Cron Jobs', href: '/cron', icon: Clock },
  { name: 'QAPI', href: '/qapi', icon: Shield },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
]

export default function Layout() {
  const { sidebarOpen, toggleSidebar } = useStore()
  const { logout, authRequired } = useAuthStore()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const navigate = useNavigate()

  // Handle command palette actions
  const handleCommandAction = (action) => {
    if (action === 'new-task') {
      navigate('/assignments?new=1')
    } else if (action === 'new-expense') {
      navigate('/expenses?new=1')
    }
  }

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onCommandPalette: () => setCommandPaletteOpen(true),
    onNewTask: () => navigate('/assignments?new=1'),
    onNewExpense: () => navigate('/expenses?new=1'),
    onCloseModal: () => setCommandPaletteOpen(false),
    modalOpen: commandPaletteOpen
  })

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-cream-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-cream-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-semibold text-warm-800">Kate's Office</h1>
                <p className="text-xs text-warm-500">Personal Assistant</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-cream-100 text-warm-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-sage-100 text-sage-700 font-medium'
                    : 'text-warm-600 hover:bg-cream-100 hover:text-warm-800'
                } ${!sidebarOpen && 'justify-center'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Decorative Elements */}
        {sidebarOpen && (
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

        {/* Collapse button (when collapsed) */}
        {!sidebarOpen && (
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
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-cream-50/80 backdrop-blur-sm border-b border-cream-200 flex items-center justify-between px-6">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-cream-100 text-warm-500 mr-4"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sage-400 animate-pulse" />
              <span className="text-sm text-warm-500">Kate is online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search / Command Palette Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-cream-200 text-warm-500 hover:border-sage-300 hover:bg-cream-50 transition-all duration-200 group"
            >
              <Search className="w-4 h-4 group-hover:text-sage-500" />
              <span className="text-sm hidden sm:inline">Search or jump to...</span>
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-cream-100 text-xs text-warm-400">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
            
            {/* Logout button - only show if auth is required */}
            {authRequired && (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-100 text-warm-500 hover:text-warm-700 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onAction={handleCommandAction}
      />
    </div>
  )
}
