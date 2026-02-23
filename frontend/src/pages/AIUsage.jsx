import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu,
  DollarSign,
  Zap,
  AlertTriangle,
  Shield,
  Clock,
  Activity,
  TrendingUp,
  Server,
  RefreshCw,
  StopCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

const MODEL_COLORS = {
  'claude-opus-4-6': '#c9a86c',
  'claude-sonnet-4-6': '#7c9885',
  'claude-sonnet-4-5': '#6b9dad',
  'claude-haiku-4-5': '#9a7ea1',
  'gpt-4.1': '#d4a574',
  'gpt-4.1-mini': '#8fa876',
}

function formatTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function BudgetGauge({ percentUsed, spent, limit, hardStopEnabled, overrideActive }) {
  const clampedPct = Math.min(percentUsed, 100)
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference

  let color = '#7c9885' // teal
  if (percentUsed >= 90) color = '#ef4444' // red
  else if (percentUsed >= 75) color = '#c9a86c' // gold

  let bgRing = '#2d2d3d'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100" cy="100" r={radius}
            fill="none" stroke={bgRing} strokeWidth="12"
          />
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold text-text-100">
            ${spent.toFixed(2)}
          </span>
          <span className="text-sm text-text-400">
            of ${limit.toFixed(0)} limit
          </span>
          <span className="text-xs mt-1" style={{ color }}>
            {percentUsed.toFixed(1)}% used
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        {hardStopEnabled && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-medium">
            <Shield className="w-3 h-3" />
            HARD STOP ACTIVE
          </span>
        )}
        {overrideActive && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/15 text-gold-400 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            OVERRIDE ACTIVE
          </span>
        )}
      </div>
    </div>
  )
}

export default function AIUsage() {
  const [todayUsage, setTodayUsage] = useState(null)
  const [history, setHistory] = useState({ dailyTotals: [], byModelAndDay: [] })
  const [budget, setBudget] = useState(null)
  const [models, setModels] = useState(null)
  const [sessions, setSessions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSessions, setShowSessions] = useState(true)
  const [showAlerts, setShowAlerts] = useState(true)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ daily_limit_usd: 40, alert_threshold_pct: 75, hard_stop_enabled: true })

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAll = async () => {
    try {
      const [todayRes, historyRes, budgetRes, modelsRes, sessionsRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/ai/usage/today`),
        fetch(`${API_URL}/ai/usage/history?days=30`),
        fetch(`${API_URL}/ai/budget`),
        fetch(`${API_URL}/ai/models`),
        fetch(`${API_URL}/ai/usage/sessions`),
        fetch(`${API_URL}/ai/alerts`),
      ])
      const [today, hist, bdg, mdl, sess, alrt] = await Promise.all([
        todayRes.json(), historyRes.json(), budgetRes.json(),
        modelsRes.json(), sessionsRes.json(), alertsRes.json(),
      ])
      setTodayUsage(today)
      setHistory(hist)
      setBudget(bdg)
      setBudgetForm({ daily_limit_usd: bdg.daily_limit_usd, alert_threshold_pct: bdg.alert_threshold_pct, hard_stop_enabled: bdg.hard_stop_enabled === 1 })
      setModels(mdl)
      setSessions(sess)
      setAlerts(alrt)
    } catch (err) {
      console.error('Failed to fetch AI usage:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetSave = async () => {
    try {
      await fetch(`${API_URL}/ai/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetForm),
      })
      setEditingBudget(false)
      fetchAll()
    } catch (err) {
      console.error('Failed to update budget:', err)
    }
  }

  const handleOverride = async () => {
    if (!confirm('Request budget override for 4 hours? This will alert Zack for approval.')) return
    try {
      await fetch(`${API_URL}/ai/budget/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'zack', duration_hours: 4 }),
      })
      fetchAll()
    } catch (err) {
      console.error('Failed to request override:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const chartData = history.dailyTotals || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-200">AI Usage & Costs</h1>
          <p className="text-text-400 mt-1">Monitor Kate's AI consumption and budget</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchAll} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => setEditingBudget(true)} className="btn btn-secondary flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Budget</span>
          </button>
          <button onClick={handleOverride} className="btn btn-primary flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Override
          </button>
        </div>
      </div>

      {/* A. Budget Status Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <BudgetGauge
            percentUsed={todayUsage?.percent_used || 0}
            spent={todayUsage?.total_cost || 0}
            limit={todayUsage?.daily_limit || 40}
            hardStopEnabled={todayUsage?.hard_stop_enabled}
            overrideActive={todayUsage?.override_active}
          />
          <div className="flex-1 w-full">
            <h2 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              Today's Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-dark-600/50">
                <p className="text-xs text-text-500">Input Tokens</p>
                <p className="text-lg font-semibold text-text-200">{formatTokens(todayUsage?.total_input || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-600/50">
                <p className="text-xs text-text-500">Output Tokens</p>
                <p className="text-lg font-semibold text-text-200">{formatTokens(todayUsage?.total_output || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-600/50">
                <p className="text-xs text-text-500">Cached</p>
                <p className="text-lg font-semibold text-text-200">{formatTokens(todayUsage?.total_cached || 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-600/50">
                <p className="text-xs text-text-500">Remaining</p>
                <p className="text-lg font-semibold text-teal-400">${(todayUsage?.remaining || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* B. Model Configuration Card */}
      {models && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-400" />
            Model Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[models.primary, ...models.fallbacks, models.cron].map((m) => (
              <div key={m.model + m.role} className="flex items-center gap-3 p-3 rounded-xl bg-dark-600/50">
                <div className="relative">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: m.status === 'active' ? '#4ade80' : '#6b7280' }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-200 truncate">{m.model}</p>
                  <p className="text-xs text-text-500">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* C. Today's Usage Breakdown */}
      {todayUsage && (todayUsage.bySessionType?.length > 0 || todayUsage.byModel?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold-400" />
            Today's Breakdown
          </h2>

          {todayUsage.bySessionType?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm text-text-400 mb-3">By Session Type</h3>
              <div className="space-y-2">
                {todayUsage.bySessionType.map((s) => (
                  <div
                    key={s.session_type}
                    className={`flex items-center justify-between p-3 rounded-xl bg-dark-600/50 ${
                      s.cost > 5 ? 'ring-1 ring-red-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-200 capitalize">{s.session_type || 'unknown'}</span>
                      {s.cost > 5 && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-text-400">{formatTokens(s.input_tokens)} in / {formatTokens(s.output_tokens)} out</span>
                      <span className="font-semibold text-text-200">${s.cost.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayUsage.byModel?.length > 0 && (
            <div>
              <h3 className="text-sm text-text-400 mb-3">By Model</h3>
              <div className="space-y-2">
                {todayUsage.byModel.map((m) => {
                  const total = todayUsage.total_cost || 1
                  const pct = (m.cost / total) * 100
                  return (
                    <div key={m.model} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: MODEL_COLORS[m.model] || '#6b7280' }}
                      />
                      <span className="text-sm text-text-300 w-40 truncate">{m.model}</span>
                      <div className="flex-1 h-2 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: MODEL_COLORS[m.model] || '#6b7280' }}
                        />
                      </div>
                      <span className="text-sm font-medium text-text-200 w-20 text-right">${m.cost.toFixed(3)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {todayUsage.bySessionType?.length === 0 && todayUsage.byModel?.length === 0 && (
            <p className="text-text-500 text-center py-4">No usage recorded today</p>
          )}
        </motion.div>
      )}

      {/* D. 30-Day Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="font-semibold text-text-200 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          30-Day Cost Trend
        </h2>
        {chartData.length > 0 ? (
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAICost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c9885" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c9885" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#8b8b9e' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8b8b9e' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #2d2d3d', borderRadius: '12px' }}
                  labelStyle={{ color: '#e0e0e8' }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                  labelFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString()}
                />
                <ReferenceLine
                  y={budget?.daily_limit_usd || 40}
                  stroke="#ef4444"
                  strokeDasharray="6 4"
                  label={{ value: `$${budget?.daily_limit_usd || 40} limit`, position: 'right', fill: '#ef4444', fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="total_cost"
                  stroke="#7c9885"
                  fillOpacity={1}
                  fill="url(#colorAICost)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-text-500 text-center py-8">No usage history yet</p>
        )}
      </motion.div>

      {/* E. Active Sessions Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <button
          onClick={() => setShowSessions(!showSessions)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="font-semibold text-text-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Active Sessions
            {sessions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 text-xs">
                {sessions.length}
              </span>
            )}
          </h2>
          {showSessions ? <ChevronUp className="w-5 h-5 text-text-500" /> : <ChevronDown className="w-5 h-5 text-text-500" />}
        </button>

        {showSessions && (
          <div className="mt-4 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-text-500 text-center py-4">No active sessions in the last 30 minutes</p>
            ) : (
              sessions.map((s) => (
                <div key={s.session_key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-dark-600/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-text-200">{s.session_key}</p>
                      <p className="text-xs text-text-500">{s.model} &middot; {s.session_type} &middot; {s.duration_minutes}min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-text-400">{formatTokens(s.total_input + s.total_output)} tokens</span>
                    <span className="text-text-400">{formatTokens(s.tokens_per_minute)}/min</span>
                    <span className="font-medium text-gold-400">${s.cost_per_hour.toFixed(2)}/hr</span>
                    <button
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                      title="Flag for review"
                    >
                      <StopCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>

      {/* F. Alert Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className="w-full flex items-center justify-between"
        >
          <h2 className="font-semibold text-text-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Alert Log
            {alerts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs">
                {alerts.length}
              </span>
            )}
          </h2>
          {showAlerts ? <ChevronUp className="w-5 h-5 text-text-500" /> : <ChevronDown className="w-5 h-5 text-text-500" />}
        </button>

        {showAlerts && (
          <div className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <p className="text-text-500 text-center py-4">No alerts recorded</p>
            ) : (
              alerts.map((a) => {
                const typeConfig = {
                  warning_75: { color: 'text-gold-400 bg-gold-500/15', icon: AlertTriangle },
                  warning_90: { color: 'text-red-400 bg-red-500/15', icon: AlertTriangle },
                  hard_stop: { color: 'text-red-400 bg-red-500/15', icon: StopCircle },
                  override_granted: { color: 'text-teal-400 bg-teal-500/15', icon: CheckCircle },
                }
                const cfg = typeConfig[a.alert_type] || typeConfig.warning_75
                const Icon = cfg.icon
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark-600/50">
                    <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-200">{a.message}</p>
                      <p className="text-xs text-text-500 mt-1">
                        {a.date} &middot; {new Date(a.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.color}`}>
                      {a.alert_type.replace('_', ' ')}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </motion.div>

      {/* Budget Edit Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-dark-700 rounded-2xl shadow-xl border border-dark-300/30 w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-text-200 mb-6">Edit AI Budget</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-400 mb-1">Daily Limit (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-500">$</span>
                  <input
                    type="number"
                    step="1"
                    value={budgetForm.daily_limit_usd}
                    onChange={(e) => setBudgetForm({ ...budgetForm, daily_limit_usd: parseFloat(e.target.value) || 0 })}
                    className="input pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-400 mb-1">
                  Alert Threshold ({budgetForm.alert_threshold_pct}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={budgetForm.alert_threshold_pct}
                  onChange={(e) => setBudgetForm({ ...budgetForm, alert_threshold_pct: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hardStop"
                  checked={budgetForm.hard_stop_enabled}
                  onChange={(e) => setBudgetForm({ ...budgetForm, hard_stop_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-300 bg-dark-600"
                />
                <label htmlFor="hardStop" className="text-sm text-text-300">
                  Enable hard stop when budget exceeded
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={handleBudgetSave} className="btn btn-primary flex-1">
                  Save Budget
                </button>
                <button onClick={() => setEditingBudget(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
