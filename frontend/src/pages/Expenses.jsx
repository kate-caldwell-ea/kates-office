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
} from 'lucide-react'

const API_URL = 'http://localhost:3847/api'

const categoryIcons = {
  gifts: Gift,
  travel: Plane,
  api_tokens: Bot,
  default: DollarSign,
}

const categoryColors = {
  gifts: 'bg-rose-gold-100 text-rose-gold-700',
  travel: 'bg-sage-100 text-sage-700',
  api_tokens: 'bg-purple-100 text-purple-700',
  default: 'bg-cream-200 text-warm-600',
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ total: 0, byCategory: [] })
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/expenses`),
        fetch(`${API_URL}/expenses/summary`)
      ])
      const [expensesData, summaryData] = await Promise.all([
        expensesRes.json(),
        summaryRes.json()
      ])
      setExpenses(expensesData)
      setSummary(summaryData)
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

  const getIcon = (category) => {
    return categoryIcons[category] || categoryIcons.default
  }

  const getColor = (category) => {
    return categoryColors[category] || categoryColors.default
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-warm-800">Expenses</h1>
          <p className="text-warm-500 mt-1">Track and manage spending</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Log Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-sage-500 to-sage-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sage-100 text-sm">Total Spent</p>
              <p className="text-3xl font-bold mt-1">${summary.total.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warm-500 text-sm">Transactions</p>
              <p className="text-2xl font-semibold text-warm-800">{expenses.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-warm-500" />
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
            <div className="w-12 h-12 rounded-xl bg-rose-gold-100 flex items-center justify-center">
              <Tag className="w-6 h-6 text-rose-gold-500" />
            </div>
          </div>
        </div>
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
        <h2 className="font-semibold text-warm-800 mb-4">Recent Expenses</h2>
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-warm-400 text-center py-8">No expenses logged yet</p>
          ) : (
            expenses.map((expense) => {
              const Icon = getIcon(expense.category)
              return (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColor(expense.category)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-warm-800 truncate">{expense.description}</p>
                      {expense.category && (
                        <span className="badge badge-cream text-xs">{expense.category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-warm-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                      {expense.vendor && (
                        <span className="truncate">{expense.vendor}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-warm-800">
                      ${expense.amount.toFixed(2)}
                    </p>
                    {expense.payment_method && (
                      <p className="text-xs text-warm-400">{expense.payment_method}</p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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

      {/* New/Edit Modal */}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
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
              <option value="api_tokens">🤖 API/Tokens</option>
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
