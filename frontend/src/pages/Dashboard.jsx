import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Sparkles,
  Zap,
  Gift,
  Wallet,
  CalendarDays,
  Cpu,
  Shield,
  HelpCircle,
  Baby,
  TrendingUp,
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
  const [aiUsage, setAiUsage] = useState(null)
  const [pendingQuestions, setPendingQuestions] = useState(0)
  const [pendingGifts, setPendingGifts] = useState(0)
  const [recentIncidents, setRecentIncidents] = useState([])

  useEffect(() => {
    // Fetch all dashboard data in parallel
    Promise.all([
      fetch(`${API_URL}/assignments`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/expenses/summary`).then(r => r.json()).catch(() => ({ total: 0 })),
      fetch(`${API_URL}/qapi/summary`).then(r => r.json()).catch(() => ({ byStatus: [], recent: [] })),
      fetch(`${API_URL}/activity?limit=5`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/ai/usage/today`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/questions`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/gifts?year=${new Date().getFullYear()}`).then(r => r.json()).catch(() => []),
    ]).then(([assignments, expSummary, qapiSummary, activity, aiToday, questions, gifts]) => {
      // Assignments
      const counts = assignments.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      }, {})
      setStats({
        assignments: {
          inbox: counts.inbox || 0,
          inProgress: counts.in_progress || 0,
          waiting: counts.waiting || 0,
          done: counts.done || 0,
        },
        expenses: { total: expSummary.total || 0, thisMonth: expSummary.total || 0 },
        qapi: {
          open: qapiSummary.byStatus?.find(s => s.status === 'open')?.count || 0,
          resolved: qapiSummary.byStatus?.find(s => s.status === 'resolved')?.count || 0,
        },
      })

      // Upcoming due dates
      const upcoming = assignments
        .filter(a => a.due_date && a.status !== 'done')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 4)
      setUpcomingAssignments(upcoming)

      setRecentActivity(activity)
      setAiUsage(aiToday)

      // Pending questions
      const pending = questions.filter(q => q.status === 'pending')
      setPendingQuestions(pending.length)

      // Pending gifts (not delivered/shipped)
      const pg = gifts.filter(g => !['delivered', 'shipped'].includes(g.status))
      setPendingGifts(pg.length)

      // Recent incidents
      setRecentIncidents(qapiSummary.recent || [])
    })
  }, [])

  const getActivityIcon = (type) => {
    if (type.includes('assignment')) return CheckCircle2
    if (type.includes('expense')) return DollarSign
    if (type.includes('qapi')) return AlertCircle
    if (type.includes('bennett')) return Baby
    if (type.includes('gift')) return Gift
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

  // AI budget gauge values
  const aiSpent = aiUsage?.total_cost || 0
  const aiLimit = aiUsage?.daily_limit || 40
  const aiPercent = aiUsage?.percent_used || 0

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
              <p className="text-text-500 text-xs uppercase tracking-widest mb-1">Command Center</p>
              <h1 className="text-xl font-semibold text-text-100">{greeting()}, Zack</h1>
              <p className="mt-1 text-sm text-text-400">Here's everything at a glance.</p>
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

      {/* Key Metrics Row - AI Budget, Questions, Gifts, QAPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'AI Budget',
            value: `$${aiSpent.toFixed(2)}`,
            sub: `${aiPercent.toFixed(0)}% of $${aiLimit}`,
            icon: Cpu,
            color: aiPercent >= 90 ? 'text-red-400' : aiPercent >= 75 ? 'text-gold-400' : 'text-teal-400',
            bg: aiPercent >= 90 ? 'bg-red-500/10' : aiPercent >= 75 ? 'bg-gold-500/10' : 'bg-teal-500/10',
            href: '/ai-usage',
          },
          {
            label: 'Unanswered',
            value: pendingQuestions,
            sub: pendingQuestions > 0 ? 'Questions waiting' : 'All caught up',
            icon: HelpCircle,
            color: pendingQuestions > 0 ? 'text-gold-400' : 'text-teal-400',
            bg: pendingQuestions > 0 ? 'bg-gold-500/10' : 'bg-teal-500/10',
            href: '/questions',
          },
          {
            label: 'Pending Gifts',
            value: pendingGifts,
            sub: 'Need attention',
            icon: Gift,
            color: 'text-gold-400',
            bg: 'bg-gold-500/10',
            href: '/gifts',
          },
          {
            label: 'QAPI Open',
            value: stats.qapi.open,
            sub: `${stats.qapi.resolved} resolved`,
            icon: Shield,
            color: stats.qapi.open > 0 ? 'text-red-400' : 'text-teal-400',
            bg: stats.qapi.open > 0 ? 'bg-red-500/10' : 'bg-teal-500/10',
            href: '/qapi',
          },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={1 + i} variants={fadeUp} initial="hidden" animate="visible">
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

      {/* Briefing + Trip Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2">
          <BriefingCard />
        </motion.div>
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <TripCountdown />
        </motion.div>
      </div>

      {/* AI Budget Meter (visual bar) */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            Today's AI Spend
          </h2>
          <Link to="/ai-usage" className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1">
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="h-4 bg-dark-400 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              aiPercent >= 90 ? 'bg-red-500' : aiPercent >= 75 ? 'bg-gold-500' : 'bg-teal-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(aiPercent, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-500">
          <span>${aiSpent.toFixed(2)} spent</span>
          <span>${(aiLimit - aiSpent).toFixed(2)} remaining</span>
        </div>
      </motion.div>

      {/* Task Stats + Due Soon + QAPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Inbox', value: stats.assignments.inbox, sub: `${stats.assignments.inProgress} in progress`, icon: Clock, color: 'text-gold-400', bg: 'bg-gold-500/10', href: '/assignments' },
          { label: 'Completed', value: stats.assignments.done, sub: 'Great progress', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10', href: '/assignments' },
          { label: 'Expenses MTD', value: `$${stats.expenses.thisMonth.toFixed(0)}`, sub: 'View details', icon: Wallet, color: 'text-gold-400', bg: 'bg-gold-500/10', href: '/expenses' },
          { label: 'Recent Incidents', value: recentIncidents.length, sub: recentIncidents.length > 0 ? recentIncidents[0]?.title?.slice(0, 30) : 'No recent', icon: AlertCircle, color: 'text-text-400', bg: 'bg-dark-500/50', href: '/qapi' },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={8 + i} variants={fadeUp} initial="hidden" animate="visible">
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
              <p className="mt-2 text-[11px] text-text-500 truncate">{stat.sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Tasks + Calendar + Birthday */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 space-y-4">
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
        <motion.div custom={13} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
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
      <motion.div custom={14} variants={fadeUp} initial="hidden" animate="visible" className="card">
        <h2 className="text-sm font-semibold text-text-200 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'New Task', icon: CheckCircle2, href: '/assignments?new=1', color: 'text-teal-400', bg: 'bg-teal-500/10' },
            { label: 'Log Expense', icon: DollarSign, href: '/expenses?new=1', color: 'text-gold-400', bg: 'bg-gold-500/10' },
            { label: 'Add Gift', icon: Gift, href: '/gifts', color: 'text-gold-400', bg: 'bg-gold-500/10' },
            { label: 'Bennett', icon: Baby, href: '/bennett', color: 'text-teal-400', bg: 'bg-teal-500/10' },
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
