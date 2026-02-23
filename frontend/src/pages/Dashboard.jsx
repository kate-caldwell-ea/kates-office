import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Send,
  Plane,
  Gift,
  Wallet,
  CalendarDays,
} from 'lucide-react'
import WeatherWidget from '../components/WeatherWidget'
import CalendarWidget, { BirthdayWidget, TripCountdown } from '../components/CalendarWidget'
import BriefingCard from '../components/BriefingCard'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    assignments: { inbox: 0, inProgress: 0, waiting: 0, done: 0 },
    expenses: { total: 0, thisMonth: 0 },
    qapi: { open: 0, resolved: 0 },
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [upcomingAssignments, setUpcomingAssignments] = useState([])

  useEffect(() => {
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
        const upcoming = data
          .filter(a => a.due_date && a.status !== 'done')
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 4)
        setUpcomingAssignments(upcoming)
      })
      .catch(console.error)

    fetch(`${API_URL}/expenses/summary`)
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          expenses: { total: data.total || 0, thisMonth: data.total || 0 }
        }))
      })
      .catch(console.error)

    fetch(`${API_URL}/qapi/summary`)
      .then(res => res.json())
      .then(data => {
        const open = data.byStatus?.find(s => s.status === 'open')?.count || 0
        const resolved = data.byStatus?.find(s => s.status === 'resolved')?.count || 0
        setStats(prev => ({ ...prev, qapi: { open, resolved } }))
      })
      .catch(console.error)

    fetch(`${API_URL}/activity?limit=5`)
      .then(res => res.json())
      .then(setRecentActivity)
      .catch(console.error)
  }, [])

  const getActivityIcon = (type) => {
    if (type.includes('assignment')) return CheckCircle2
    if (type.includes('expense')) return DollarSign
    if (type.includes('qapi')) return AlertCircle
    return Zap
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((date - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    if (diff < 7) return `In ${diff}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-gold-400'
      default: return 'text-text-400'
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-5">
      {/* Greeting + Weather Row */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1 card card-glow bg-gradient-to-br from-dark-600/80 to-dark-700/80 border-gold-500/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-text-500 text-xs uppercase tracking-widest mb-1">Dashboard</p>
              <h1 className="text-xl font-semibold text-text-100">{greeting()}, Zack</h1>
              <p className="mt-1 text-sm text-text-400">Here's your command center.</p>
            </div>
            <div className="flex items-center gap-2 bg-teal-600/15 rounded-lg px-3 py-1.5 border border-teal-500/20">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-teal-300">Kate Online</span>
            </div>
          </div>
        </div>
        <div className="sm:w-72">
          <WeatherWidget />
        </div>
      </motion.div>

      {/* Briefing + Trip Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2">
          <BriefingCard />
        </motion.div>
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <TripCountdown />
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Inbox', value: stats.assignments.inbox, sub: `${stats.assignments.inProgress} in progress`, icon: Clock, color: 'text-gold-400', bg: 'bg-gold-500/10', href: '/assignments' },
          { label: 'Completed', value: stats.assignments.done, sub: 'Great progress', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10', href: '/assignments' },
          { label: 'Expenses MTD', value: `$${stats.expenses.thisMonth.toFixed(0)}`, sub: 'View details', icon: Wallet, color: 'text-gold-400', bg: 'bg-gold-500/10', href: '/expenses' },
          { label: 'QAPI Items', value: stats.qapi.open, sub: `${stats.qapi.resolved} resolved`, icon: AlertCircle, color: 'text-text-400', bg: 'bg-dark-500/50', href: '/qapi' },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={3 + i} variants={fadeUp} initial="hidden" animate="visible">
            <Link to={stat.href} className="card card-hover block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-500">{stat.label}</p>
                  <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-text-500">{stat.sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Tasks + Calendar + Birthday */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 space-y-4">
          {/* Active Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-200 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gold-500" />
                Due Soon
              </h2>
              <Link
                to="/assignments"
                className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingAssignments.length === 0 ? (
                <p className="text-text-500 text-sm py-4 text-center">
                  No upcoming deadlines. Clear!
                </p>
              ) : (
                upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-dark-600/50 hover:bg-dark-500/50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-200 truncate">{assignment.title}</p>
                      <p className="text-[11px] text-text-500 mt-0.5">
                        {assignment.tags?.slice(0, 2).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                        {formatDate(assignment.due_date)}
                      </p>
                      <p className="text-[10px] text-text-500 capitalize">{assignment.priority}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calendar */}
          <CalendarWidget />
        </motion.div>

        {/* Right Column */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <BirthdayWidget />

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-sm font-semibold text-text-200 mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-text-500 text-sm text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-dark-500/80 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-text-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-300 truncate">{activity.description}</p>
                        <p className="text-[10px] text-text-500 mt-0.5">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="card">
        <h2 className="text-sm font-semibold text-text-200 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'New Task', icon: CheckCircle2, href: '/assignments?new=1', color: 'text-teal-400', bg: 'bg-teal-500/10' },
            { label: 'Log Expense', icon: DollarSign, href: '/expenses?new=1', color: 'text-gold-400', bg: 'bg-gold-500/10' },
            { label: 'View QAPI', icon: TrendingUp, href: '/qapi', color: 'text-text-300', bg: 'bg-dark-500/50' },
            { label: 'Telegram', icon: Send, href: '#', color: 'text-blue-400', bg: 'bg-blue-500/10', external: true },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="flex items-center gap-3 p-3 rounded-xl bg-dark-600/40 hover:bg-dark-500/50 transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <span className="text-sm text-text-300 font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
