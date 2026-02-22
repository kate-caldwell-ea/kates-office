import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  KanbanSquare,
  Receipt,
  Shield,
  MessageCircle,
  Clock,
  HelpCircle,
  Plus,
  CheckCircle2,
  DollarSign,
  Command,
  ArrowRight,
  Calendar,
  Tag,
} from 'lucide-react'
import { API_URL } from '../config.js'

const navigation = [
  { id: 'nav-dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard, type: 'page', shortcut: '1' },
  { id: 'nav-assignments', name: 'Assignments', href: '/assignments', icon: KanbanSquare, type: 'page', shortcut: '2' },
  { id: 'nav-expenses', name: 'Expenses', href: '/expenses', icon: Receipt, type: 'page', shortcut: '3' },
  { id: 'nav-questions', name: 'Questions', href: '/questions', icon: HelpCircle, type: 'page', shortcut: '4' },
  { id: 'nav-cron', name: 'Cron Jobs', href: '/cron', icon: Clock, type: 'page', shortcut: '5' },
  { id: 'nav-qapi', name: 'QAPI', href: '/qapi', icon: Shield, type: 'page' },
  { id: 'nav-chat', name: 'Chat', href: '/chat', icon: MessageCircle, type: 'page' },
]

const quickActions = [
  { id: 'action-new-task', name: 'New Task', icon: Plus, type: 'action', action: 'new-task', shortcut: 'N' },
  { id: 'action-new-expense', name: 'New Expense', icon: DollarSign, type: 'action', action: 'new-expense', shortcut: 'E' },
]

export default function CommandPalette({ isOpen, onClose, onAction }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState({ assignments: [], expenses: [] })
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setSearchResults({ assignments: [], expenses: [] })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Search across data when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults({ assignments: [], expenses: [] })
      return
    }

    const searchData = async () => {
      setIsSearching(true)
      try {
        const [assignmentsRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/assignments`),
          fetch(`${API_URL}/expenses`)
        ])
        const [assignments, expenses] = await Promise.all([
          assignmentsRes.json(),
          expensesRes.json()
        ])

        const lowerQuery = query.toLowerCase()
        
        const filteredAssignments = assignments
          .filter(a => 
            a.title?.toLowerCase().includes(lowerQuery) ||
            a.description?.toLowerCase().includes(lowerQuery) ||
            a.tags?.some(t => t.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 5)

        const filteredExpenses = expenses
          .filter(e =>
            e.description?.toLowerCase().includes(lowerQuery) ||
            e.category?.toLowerCase().includes(lowerQuery) ||
            e.vendor?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)

        setSearchResults({
          assignments: filteredAssignments,
          expenses: filteredExpenses
        })
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchData, 200)
    return () => clearTimeout(debounce)
  }, [query])

  // Build filtered results
  const filteredItems = useMemo(() => {
    const items = []
    const lowerQuery = query.toLowerCase()

    // Always show quick actions first
    if (!query.trim()) {
      items.push(...quickActions.map(a => ({ ...a, section: 'Quick Actions' })))
      items.push(...navigation.map(n => ({ ...n, section: 'Navigation' })))
    } else {
      // Filter navigation and actions
      const matchedActions = quickActions.filter(a => 
        a.name.toLowerCase().includes(lowerQuery)
      )
      const matchedNav = navigation.filter(n => 
        n.name.toLowerCase().includes(lowerQuery)
      )

      if (matchedActions.length) {
        items.push(...matchedActions.map(a => ({ ...a, section: 'Quick Actions' })))
      }
      if (matchedNav.length) {
        items.push(...matchedNav.map(n => ({ ...n, section: 'Navigation' })))
      }

      // Add search results
      if (searchResults.assignments.length) {
        items.push(...searchResults.assignments.map(a => ({
          id: `task-${a.id}`,
          name: a.title,
          description: a.description,
          icon: CheckCircle2,
          type: 'search-result',
          resultType: 'task',
          data: a,
          section: 'Tasks'
        })))
      }
      if (searchResults.expenses.length) {
        items.push(...searchResults.expenses.map(e => ({
          id: `expense-${e.id}`,
          name: e.description,
          description: `$${e.amount?.toFixed(2)} · ${e.category || 'Uncategorized'}`,
          icon: Receipt,
          type: 'search-result',
          resultType: 'expense',
          data: e,
          section: 'Expenses'
        })))
      }
    }

    return items
  }, [query, searchResults])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems.length])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredItems[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (item) => {
    if (item.type === 'page') {
      navigate(item.href)
      onClose()
    } else if (item.type === 'action') {
      onAction?.(item.action)
      onClose()
    } else if (item.type === 'search-result') {
      if (item.resultType === 'task') {
        navigate('/assignments')
      } else if (item.resultType === 'expense') {
        navigate('/expenses')
      }
      onClose()
    }
  }

  if (!isOpen) return null

  // Group items by section
  const groupedItems = filteredItems.reduce((acc, item) => {
    const section = item.section || 'Results'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {})

  let flatIndex = -1

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideDown"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-200">
          <Search className="w-5 h-5 text-warm-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, expenses, or type a command..."
            className="flex-1 bg-transparent outline-none text-warm-800 placeholder:text-warm-400"
          />
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-cream-100 text-warm-500 text-xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section}>
              <div className="px-4 py-2 text-xs font-medium text-warm-500 uppercase tracking-wide bg-cream-50 sticky top-0">
                {section}
              </div>
              {items.map((item) => {
                flatIndex++
                const isSelected = flatIndex === selectedIndex
                const Icon = item.icon
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? 'bg-sage-50' : 'hover:bg-cream-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-sage-100' : 'bg-cream-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-sage-600' : 'text-warm-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isSelected ? 'text-sage-700' : 'text-warm-800'}`}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-sm text-warm-500 truncate">{item.description}</p>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="px-2 py-1 rounded bg-cream-100 text-warm-500 text-xs font-mono">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-sage-500" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {filteredItems.length === 0 && query.trim() && !isSearching && (
            <div className="px-4 py-12 text-center">
              <Search className="w-12 h-12 text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500">No results found for "{query}"</p>
              <p className="text-sm text-warm-400 mt-1">Try a different search term</p>
            </div>
          )}

          {isSearching && (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-warm-400 mt-2 text-sm">Searching...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-cream-200 bg-cream-50 flex items-center justify-between text-xs text-warm-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-cream-200 font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-cream-200 font-mono">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-cream-200 font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
