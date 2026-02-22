import { API_URL } from '../config.js';
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
        <div className="h-48 bg-cream-200 rounded-lg"></div>
      </div>
    )
  }

  if (!briefing) return null

  const hasAlerts = briefing.summary.urgent > 0 || 
                    briefing.summary.openIncidents > 0 || 
                    briefing.budgetAlerts?.length > 0

  return (
    <div className="card bg-gradient-to-br from-sage-50 to-cream-50 border-sage-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sage-600" />
          </div>
          <div>
            <p className="text-sm text-warm-500">{briefing.greeting}, Zack</p>
            <h3 className="font-semibold text-warm-800">Today's Briefing</h3>
          </div>
        </div>
        <span className="text-xs text-warm-400">
          {new Date(briefing.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-white/50">
          <p className="text-lg font-semibold text-warm-800">{briefing.summary.inbox}</p>
          <p className="text-xs text-warm-500">Inbox</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50">
          <p className={`text-lg font-semibold ${briefing.summary.urgent > 0 ? 'text-red-500' : 'text-warm-800'}`}>
            {briefing.summary.urgent}
          </p>
          <p className="text-xs text-warm-500">Urgent</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50">
          <p className="text-lg font-semibold text-warm-800">{briefing.summary.dueToday}</p>
          <p className="text-xs text-warm-500">Due Today</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50">
          <p className={`text-lg font-semibold ${briefing.summary.openIncidents > 0 ? 'text-amber-500' : 'text-warm-800'}`}>
            {briefing.summary.openIncidents}
          </p>
          <p className="text-xs text-warm-500">QAPI</p>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2 mb-4">
          {briefing.summary.urgent > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                {briefing.summary.urgent} urgent {briefing.summary.urgent === 1 ? 'task' : 'tasks'} need attention
              </span>
              <Link to="/assignments" className="ml-auto">
                <ChevronRight className="w-4 h-4 text-red-400" />
              </Link>
            </div>
          )}
          
          {briefing.budgetAlerts?.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
              <TrendingDown className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                {alert.name}: ${alert.spent.toFixed(0)} / ${alert.budget} ({alert.percentage}%)
              </span>
              <Link to="/expenses" className="ml-auto">
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Today's Events */}
      {briefing.todayEvents?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-warm-500 uppercase tracking-wide mb-2">Today</p>
          <div className="space-y-1">
            {briefing.todayEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                <CalendarCheck className="w-4 h-4 text-sage-500" />
                <span className="text-sm text-warm-700">{event.title}</span>
                {event.time && (
                  <span className="ml-auto text-xs text-warm-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {event.time}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Up */}
      <div className="flex flex-wrap gap-2">
        {briefing.upcomingBirthdays?.slice(0, 2).map((b, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-gold-100 text-rose-gold-700 text-xs">
            <Gift className="w-3 h-3" />
            {b.name} in {b.daysUntil}d
          </span>
        ))}
        
        {briefing.nextTrip && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
            <Plane className="w-3 h-3" />
            {briefing.nextTrip.name} in {briefing.nextTrip.daysUntil}d
          </span>
        )}
      </div>

      {/* Pending Questions */}
      {briefing.pendingQuestions && (
        <Link 
          to="/questions"
          className="block mt-4 p-3 rounded-lg bg-sage-100 border border-sage-200 hover:bg-sage-200 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-medium text-sage-700">
                Kate has {briefing.pendingQuestions.questions?.length || 0} questions for you
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-sage-500" />
          </div>
        </Link>
      )}
    </div>
  )
}
