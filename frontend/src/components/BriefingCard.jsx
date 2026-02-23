import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  AlertCircle,
  Clock,
  CalendarCheck,
  TrendingDown,
  ChevronRight,
  Gift,
  Plane
} from 'lucide-react'

export default function BriefingCard() {
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/briefing`)
      .then(res => res.json())
      .then(setBriefing)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-48 bg-dark-500 rounded-lg"></div>
      </div>
    )
  }

  if (!briefing) return null

  const hasAlerts = briefing.summary.urgent > 0 ||
                    briefing.summary.openIncidents > 0 ||
                    briefing.budgetAlerts?.length > 0

  return (
    <div className="card border-dark-300/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold-400" />
          </div>
          <div>
            <p className="text-[10px] text-text-500 uppercase tracking-wider">{briefing.greeting}, Zack</p>
            <h3 className="text-sm font-semibold text-text-100">Today's Briefing</h3>
          </div>
        </div>
        <span className="text-[10px] text-text-500">
          {new Date(briefing.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Inbox', value: briefing.summary.inbox, alert: false },
          { label: 'Urgent', value: briefing.summary.urgent, alert: briefing.summary.urgent > 0 },
          { label: 'Due Today', value: briefing.summary.dueToday, alert: false },
          { label: 'QAPI', value: briefing.summary.openIncidents, alert: briefing.summary.openIncidents > 0 },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-2 rounded-lg bg-dark-600/50">
            <p className={`text-lg font-semibold ${stat.alert ? 'text-red-400' : 'text-text-200'}`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-text-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2 mb-4">
          {briefing.summary.urgent > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-300">
                {briefing.summary.urgent} urgent {briefing.summary.urgent === 1 ? 'task' : 'tasks'} need attention
              </span>
              <Link to="/assignments" className="ml-auto">
                <ChevronRight className="w-4 h-4 text-red-400/60" />
              </Link>
            </div>
          )}

          {briefing.budgetAlerts?.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-gold-500/10 border border-gold-500/20">
              <TrendingDown className="w-4 h-4 text-gold-400" />
              <span className="text-xs text-gold-300">
                {alert.name}: ${alert.spent.toFixed(0)} / ${alert.budget} ({alert.percentage}%)
              </span>
              <Link to="/expenses" className="ml-auto">
                <ChevronRight className="w-4 h-4 text-gold-400/60" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Today's Events */}
      {briefing.todayEvents?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-text-500 uppercase tracking-widest mb-2">Today</p>
          <div className="space-y-1">
            {briefing.todayEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-dark-600/30">
                <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-xs text-text-300">{event.title}</span>
                {event.time && (
                  <span className="ml-auto text-[10px] text-text-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {event.time}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Up tags */}
      <div className="flex flex-wrap gap-2">
        {briefing.upcomingBirthdays?.slice(0, 2).map((b, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold-500/10 text-gold-400 text-[10px] font-medium">
            <Gift className="w-3 h-3" />
            {b.name} in {b.daysUntil}d
          </span>
        ))}

        {briefing.nextTrip && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-[10px] font-medium">
            <Plane className="w-3 h-3" />
            {briefing.nextTrip.name} in {briefing.nextTrip.daysUntil}d
          </span>
        )}
      </div>

      {/* Pending Questions */}
      {briefing.pendingQuestions && (
        <Link
          to="/questions"
          className="block mt-4 p-3 rounded-lg bg-gold-500/10 border border-gold-500/15 hover:bg-gold-500/15 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-medium text-gold-300">
                Kate has {briefing.pendingQuestions.questions?.length || 0} questions for you
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gold-400/60" />
          </div>
        </Link>
      )}
    </div>
  )
}
