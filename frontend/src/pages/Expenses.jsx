import { API_URL, WS_URL } from '../config.js';
import { useEffect, useState } from 'react'
import {
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  X,
  Edit3,
  Trash2,
  Gift,
  Plane,
  CreditCard,
  Bot,
  Download,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'


const categoryIcons = {
  gifts: Gift,
  travel: Plane,
  ai_services: Bot,
  default: DollarSign,
}

const categoryColors = {
  gifts: 'bg-rose-gold-100 text-rose-gold-700',
  travel: 'bg-sage-100 text-sage-700',
  ai_services: 'bg-purple-100 text-purple-700',
  dining: 'bg-amber-100 text-amber-700',
  subscriptions: 'bg-blue-100 text-blue-700',
  household: 'bg-teal-100 text-teal-700',
  health: 'bg-red-100 text-red-700',
  default: 'bg-cream-200 text-warm-600',
}

const CHART_COLORS = ['#7c9885', '#c9a86c', '#9a7ea1', '#6b9dad', '#d4a574', '#8fa876']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ total: 0, byCategory: [] })
  const [budgets, setBudgets] = useState([])
  const [budgetStatus, setBudgetStatus] = useState([])
  const [trends, setTrends] = useState({ trends: [], byCategory: [] })
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [showTrends, setShowTrends] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, summaryRes, budgetsRes, budgetStatusRes, trendsRes] = await Promise.all([
        fetch(`${API_URL}/expenses`),
        fetch(`${API_URL}/expenses/summary`),
        fetch(`${API_URL}/budgets`),
        fetch(`${API_URL}/budgets/status`),
        fetch(`${API_URL}/expenses/trends?days=30`)
      ])
      const [expensesData, summaryData, budgetsData, budgetStatusData, trendsData] = await Promise.all([
        expensesRes.json(),
        summaryRes.json(),
        budgetsRes.json(),
        budgetStatusRes.json(),
        trendsRes.json()
      ])
      setExpenses(expensesData)
      setSummary(summaryData)
      setBudgets(budgetsData)
      setBudgetStatus(budgetStatusData)
      setTrends(trendsData)
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleDeleteBudget = async (id) => {
    if (!confirm('Delete this budget?')) return
    try {
      await fetch(`${API_URL}/budgets/${id}`, { method: 'DELETE' })
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleExport = () => {
    window.open(`${API_URL}/expenses/export?format=csv`, '_blank')
  }

  const getIcon = (category) => {
    return categoryIcons[category] || categoryIcons.default
  }

  const getColor = (category) => {
    return categoryColors[category] || categoryColors.default
  }

  const getBudgetColor = (status) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500'
      case 'warning': return 'bg-amber-500'
      default: return 'bg-sage-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-warm-800">Expenses</h1>
          <p className="text-warm-500 mt-1">Track spending and manage budgets</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExport} 
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button 
            onClick={() => setShowBudgetModal(true)} 
            className="btn btn-secondary flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Add Budget</span>
          </button>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-sage-500 to-sage-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sage-100 text-sm">Total Spent</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">${summary.total.toFixed(0)}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warm-500 text-sm">Transactions</p>
              <p className="text-2xl font-semibold text-warm-800">{expenses.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cream-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-warm-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warm-500 text-sm">Categories</p>
              <p className="text-2xl font-semibold text-warm-800">
                {summary.byCategory?.length || 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-gold-100 flex items-center justify-center">
              <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-rose-gold-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warm-500 text-sm">Budgets</p>
              <p className="text-2xl font-semibold text-warm-800">{budgets.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Status */}
      {budgetStatus.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-sage-500" />
            Budget Progress
          </h2>
          <div className="space-y-4">
            {budgetStatus.map((budget) => (
              <div key={budget.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-warm-700">{budget.name}</span>
                    {budget.status === 'exceeded' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    {budget.status === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-warm-600">
                      ${budget.spent.toFixed(0)} / ${budget.amount.toFixed(0)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      budget.status === 'exceeded' 
                        ? 'bg-red-100 text-red-700' 
                        : budget.status === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sage-100 text-sage-700'
                    }`}>
                      {budget.percentage}%
                    </span>
                    <button
                      onClick={() => setEditingBudget(budget)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-cream-100 rounded"
                    >
                      <Edit3 className="w-3 h-3 text-warm-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBudgetColor(budget.status)}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                {budget.status !== 'ok' && (
                  <p className="text-xs text-warm-500 mt-1">
                    {budget.status === 'exceeded' 
                      ? `Over budget by $${Math.abs(budget.remaining).toFixed(0)}`
                      : `$${budget.remaining.toFixed(0)} remaining`
                    }
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Section */}
      <div className="card">
        <button
          onClick={() => setShowTrends(!showTrends)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="font-semibold text-warm-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sage-500" />
            Spending Trends
          </h2>
          {showTrends ? <ChevronUp className="w-5 h-5 text-warm-400" /> : <ChevronDown className="w-5 h-5 text-warm-400" />}
        </button>
        
        {showTrends && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Spending Chart */}
            {trends.trends?.length > 0 && (
              <div>
                <h3 className="text-sm text-warm-500 mb-3">Daily Spending (Last 30 Days)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.trends}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c9885" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7c9885" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val) => val.slice(-5)}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Spent']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#7c9885" 
                        fillOpacity={1} 
                        fill="url(#colorSpend)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Category Pie Chart */}
            {trends.byCategory?.length > 0 && (
              <div>
                <h3 className="text-sm text-warm-500 mb-3">By Category</h3>
                <div className="h-48 flex items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trends.byCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="total"
                          nameKey="category"
                        >
                          {trends.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-1">
                    {trends.byCategory.slice(0, 5).map((cat, i) => (
                      <div key={cat.category} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-3 h-3 rounded-sm" 
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-warm-600 capitalize truncate">{cat.category || 'other'}</span>
                        <span className="text-warm-400 ml-auto">${cat.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {summary.byCategory && summary.byCategory.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-warm-800 mb-4">By Category</h2>
          <div className="space-y-3">
            {summary.byCategory.map((cat) => {
              const Icon = getIcon(cat.category)
              const percentage = summary.total > 0 ? (cat.total / summary.total) * 100 : 0
              return (
                <div key={cat.category || 'uncategorized'} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColor(cat.category)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-warm-700 capitalize">
                        {cat.category || 'Other'}
                      </span>
                      <span className="text-warm-600">${cat.total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-warm-800">Recent Expenses</h2>
          <span className="text-sm text-warm-400">{expenses.length} total</span>
        </div>
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-warm-400 text-center py-8">No expenses logged yet</p>
          ) : (
            expenses.slice(0, 20).map((expense) => {
              const Icon = getIcon(expense.category)
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors group"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getColor(expense.category)}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-warm-800 truncate">{expense.description}</p>
                      {expense.category && (
                        <span className="hidden sm:inline badge badge-cream text-xs">{expense.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-warm-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                      {expense.vendor && (
                        <span className="hidden sm:block truncate">{expense.vendor}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-semibold text-warm-800">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="p-2 rounded-lg hover:bg-cream-200 text-warm-500"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* New/Edit Expense Modal */}
      {(showNewModal || editingExpense) && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => {
            setShowNewModal(false)
            setEditingExpense(null)
          }}
          onSaved={fetchData}
        />
      )}

      {/* Budget Modal */}
      {(showBudgetModal || editingBudget) && (
        <BudgetModal
          budget={editingBudget}
          onClose={() => {
            setShowBudgetModal(false)
            setEditingBudget(null)
          }}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}

function ExpenseModal({ expense, onClose, onSaved }) {
  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount?.toString() || '')
  const [category, setCategory] = useState(expense?.category || '')
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState(expense?.vendor || '')
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!description.trim() || !amount) return
    setLoading(true)
    try {
      const method = expense ? 'PATCH' : 'POST'
      const url = expense 
        ? `${API_URL}/expenses/${expense.id}` 
        : `${API_URL}/expenses`
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          category: category || null,
          date,
          vendor: vendor || null,
          payment_method: paymentMethod || null,
        })
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-warm-800">
            {expense ? 'Edit Expense' : 'Log Expense'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream-100 text-warm-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-warm-500 mb-1">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="What was this for?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-500 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-warm-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="">Select category...</option>
              <option value="gifts">🎁 Gifts</option>
              <option value="travel">✈️ Travel</option>
              <option value="dining">🍽️ Dining</option>
              <option value="subscriptions">📦 Subscriptions</option>
              <option value="household">🏠 Household</option>
              <option value="health">💊 Health</option>
              <option value="ai_services">🤖 AI Services</option>
              <option value="other">📋 Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-500 mb-1">Vendor</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="input"
                placeholder="Amazon, etc."
              />
            </div>
            <div>
              <label className="block text-sm text-warm-500 mb-1">Payment Method</label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input"
                placeholder="Mercury ••3019"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={loading || !description.trim() || !amount}
              className="btn btn-primary flex-1"
            >
              {expense ? 'Save Changes' : 'Log Expense'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BudgetModal({ budget, onClose, onSaved }) {
  const [name, setName] = useState(budget?.name || '')
  const [amount, setAmount] = useState(budget?.amount?.toString() || '')
  const [category, setCategory] = useState(budget?.category || '')
  const [period, setPeriod] = useState(budget?.period || 'monthly')
  const [alertThreshold, setAlertThreshold] = useState(budget?.alert_threshold?.toString() || '0.8')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !amount) return
    setLoading(true)
    try {
      const method = budget ? 'PATCH' : 'POST'
      const url = budget 
        ? `${API_URL}/budgets/${budget.id}` 
        : `${API_URL}/budgets`
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount),
          category: category || null,
          period,
          alert_threshold: parseFloat(alertThreshold),
        })
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-warm-800">
            {budget ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream-100 text-warm-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-warm-500 mb-1">Budget Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Monthly Dining"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-warm-500 mb-1">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">$</span>
                <input
                  type="number"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input pl-7"
                  placeholder="500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-warm-500 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-warm-500 mb-1">Category (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="">All expenses</option>
              <option value="gifts">🎁 Gifts</option>
              <option value="travel">✈️ Travel</option>
              <option value="dining">🍽️ Dining</option>
              <option value="subscriptions">📦 Subscriptions</option>
              <option value="household">🏠 Household</option>
              <option value="health">💊 Health</option>
              <option value="ai_services">🤖 AI Services</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-warm-500 mb-1">
              Alert at ({Math.round(parseFloat(alertThreshold || 0.8) * 100)}% of budget)
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={loading || !name.trim() || !amount}
              className="btn btn-primary flex-1"
            >
              {budget ? 'Save Changes' : 'Create Budget'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
