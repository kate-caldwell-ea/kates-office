import { API_URL, WS_URL } from '../config.js';
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Gift,
  Plane,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import useStore from '../store/useStore'


// Office quotes
const quotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Well done is better than well said. — Benjamin Franklin",
  "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
  "Do one thing every day that scares you. — Eleanor Roosevelt",
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    assignments: { inbox: 0, inProgress: 0, waiting: 0, done: 0 },
    expenses: { total: 0, thisMonth: 0 },
    qapi: { open: 0, resolved: 0 },
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingAssignments, setUpcomingAssignments] = useState([])
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)])

  useEffect(() => {
    // Fetch assignments
    fetch(`${API_URL}/assignments`)
      .then(res => res.json())
      .then(data => {
        const counts = data.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1
          return acc
        }, {})
        setStats(prev => ({
          ...prev,
          assignments: {
            inbox: counts.inbox || 0,
            inProgress: counts.in_progress || 0,
            waiting: counts.waiting || 0,
            done: counts.done || 0,
          }
        }))
        // Get upcoming assignments with due dates
        const upcoming = data
          .filter(a => a.due_date && a.status !== 'done')
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 4)
        setUpcomingAssignments(upcoming)
      })
      .catch(console.error)

    // Fetch expense summary
    fetch(`${API_URL}/expenses/summary`)
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          expenses: { total: data.total || 0, thisMonth: data.total || 0 }
        }))
      })
      .catch(console.error)

    // Fetch QAPI summary
    fetch(`${API_URL}/qapi/summary`)
      .then(res => res.json())
      .then(data => {
        const open = data.byStatus?.find(s => s.status === 'open')?.count || 0
        const resolved = data.byStatus?.find(s => s.status === 'resolved')?.count || 0
        setStats(prev => ({
          ...prev,
          qapi: { open, resolved }
        }))
      })
      .catch(console.error)

    // Fetch recent activity
    fetch(`${API_URL}/activity?limit=5`)
      .then(res => res.json())
      .then(setRecentActivity)
      .catch(console.error)
  }, [])

  const getActivityIcon = (type) => {
    if (type.includes('assignment')) return CheckCircle2
    if (type.includes('expense')) return DollarSign
    if (type.includes('qapi')) return AlertCircle
    return MessageSquare
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff < 7) return `In ${diff} days`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-rose-gold-500'
      default: return 'text-warm-500'
    }
  }

  const getTagIcon = (tag) => {
    if (tag.includes('gift') || tag.includes('birthday')) return Gift
    if (tag.includes('travel')) return Plane
    return Calendar
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-sage-500 to-sage-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, Zack! 👋</h1>
            <p className="mt-1 text-sage-100">Here's what's happening today.</p>
            <p className="mt-4 text-sm text-sage-200 italic max-w-xl">"{quote}"</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Kate is ready</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Inbox</p>
              <p className="text-2xl font-semibold text-warm-800">{stats.assignments.inbox}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warm-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-warm-400">
            {stats.assignments.inProgress} in progress, {stats.assignments.waiting} waiting
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Completed</p>
              <p className="text-2xl font-semibold text-sage-600">{stats.assignments.done}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-sage-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-warm-400">Great progress!</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">Expenses (MTD)</p>
              <p className="text-2xl font-semibold text-rose-gold-600">
                ${stats.expenses.thisMonth.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-gold-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-rose-gold-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-warm-400">Tracked and organized</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-500">QAPI Items</p>
              <p className="text-2xl font-semibold text-warm-800">{stats.qapi.open}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warm-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-warm-400">
            {stats.qapi.resolved} resolved this month
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Assignments */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-warm-800">Upcoming</h2>
            <Link 
              to="/assignments" 
              className="text-sm text-sage-600 hover:text-sage-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAssignments.length === 0 ? (
              <p className="text-warm-400 text-sm py-4 text-center">
                No upcoming deadlines. Inbox is clear! 🎉
              </p>
            ) : (
              upcomingAssignments.map((assignment) => {
                const TagIcon = assignment.tags?.[0] ? getTagIcon(assignment.tags[0]) : Calendar
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <TagIcon className="w-5 h-5 text-sage-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-800 truncate">{assignment.title}</p>
                      <p className="text-xs text-warm-400 mt-0.5">
                        {assignment.tags?.slice(0, 2).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPriorityColor(assignment.priority)}`}>
                        {formatDate(assignment.due_date)}
                      </p>
                      <p className="text-xs text-warm-400 capitalize">{assignment.priority}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-warm-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-warm-400 text-sm text-center py-4">
                No recent activity yet
              </p>
            ) : (
              recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-warm-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-warm-700 truncate">{activity.description}</p>
                      <p className="text-xs text-warm-400 mt-0.5">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-warm-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/assignments"
            className="flex items-center gap-3 p-4 rounded-xl bg-sage-50 hover:bg-sage-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-sage-200 flex items-center justify-center group-hover:bg-sage-300 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-sage-700" />
            </div>
            <span className="font-medium text-sage-700">New Task</span>
          </Link>
          <Link
            to="/expenses"
            className="flex items-center gap-3 p-4 rounded-xl bg-rose-gold-50 hover:bg-rose-gold-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-gold-200 flex items-center justify-center group-hover:bg-rose-gold-300 transition-colors">
              <DollarSign className="w-5 h-5 text-rose-gold-700" />
            </div>
            <span className="font-medium text-rose-gold-700">Log Expense</span>
          </Link>
          <Link
            to="/chat"
            className="flex items-center gap-3 p-4 rounded-xl bg-cream-100 hover:bg-cream-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-cream-300 flex items-center justify-center group-hover:bg-cream-400 transition-colors">
              <MessageSquare className="w-5 h-5 text-warm-700" />
            </div>
            <span className="font-medium text-warm-700">Chat with Kate</span>
          </Link>
          <Link
            to="/qapi"
            className="flex items-center gap-3 p-4 rounded-xl bg-warm-100 hover:bg-warm-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-warm-200 flex items-center justify-center group-hover:bg-warm-300 transition-colors">
              <TrendingUp className="w-5 h-5 text-warm-700" />
            </div>
            <span className="font-medium text-warm-700">View QAPI</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
