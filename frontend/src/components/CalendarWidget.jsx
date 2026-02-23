import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'
import { Calendar, Gift, Plane, Heart, Clock, Stethoscope, Users, DollarSign, RefreshCw } from 'lucide-react'

const eventTypeIcons = {
  medical: Stethoscope,
  social: Users,
  family: Heart,
  financial: DollarSign,
  personal: Calendar,
}

export default function CalendarWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchCalendar = () => {
    setLoading(true)
    setError(false)
    fetch(`${API_URL}/calendar`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCalendar()
  }, [])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-40 bg-dark-500 rounded-lg"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-dark-500 flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-text-400" />
          </div>
          <h3 className="font-medium text-text-300 mb-1">Calendar syncing...</h3>
          <p className="text-sm text-text-500 mb-3">Kate is working on the connection</p>
          <button
            onClick={fetchCalendar}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-400 bg-teal-500/10 rounded-lg hover:bg-teal-500/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const upcomingEvents = data.events?.slice(0, 4) || []

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          Upcoming Events
        </h3>
      </div>

      <div className="space-y-2">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-text-500 text-center py-4">No upcoming events</p>
        ) : (
          upcomingEvents.map((event, i) => {
            const Icon = eventTypeIcons[event.type] || Calendar
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-600/40 hover:bg-dark-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-200 truncate">{event.title}</p>
                  {event.time && (
                    <p className="text-[10px] text-text-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.time}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    event.daysUntil === 0
                      ? 'bg-teal-500/15 text-teal-400'
                      : event.daysUntil <= 3
                        ? 'bg-gold-500/15 text-gold-400'
                        : 'bg-dark-400/50 text-text-400'
                  }`}>
                    {event.daysUntil === 0 ? 'Today' : event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil}d`}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export function BirthdayWidget() {
  const [birthdays, setBirthdays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/calendar`)
      .then(res => res.json())
      .then(data => setBirthdays(data.birthdays?.slice(0, 5) || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-32 bg-dark-500 rounded-lg"></div>
      </div>
    )
  }

  if (birthdays.length === 0) return null

  return (
    <div className="card border-gold-500/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-200 flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold-400" />
          Birthdays
        </h3>
      </div>

      <div className="space-y-2">
        {birthdays.map((birthday, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <span className="text-sm">🎂</span>
              </div>
              <div>
                <p className="text-sm text-text-200">{birthday.name}</p>
                <p className="text-[10px] text-text-500 capitalize">{birthday.relation}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${
                birthday.daysUntil <= 7 ? 'text-gold-400' : 'text-text-400'
              }`}>
                {birthday.daysUntil === 0 ? 'Today!' :
                 birthday.daysUntil === 1 ? 'Tomorrow' :
                 `${birthday.daysUntil}d`}
              </span>
              {birthday.turning && (
                <p className="text-[10px] text-text-500">Turning {birthday.turning}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TripCountdown() {
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/calendar`)
      .then(res => res.json())
      .then(data => {
        const nextTrip = data.trips?.sort((a, b) => a.daysUntil - b.daysUntil)?.[0]
        setTrip(nextTrip)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !trip) return null

  const isActive = trip.isActive

  return (
    <div className="card border-teal-500/15 bg-gradient-to-br from-dark-700/80 to-dark-600/40">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-500/15 flex items-center justify-center">
          <Plane className="w-5 h-5 text-teal-400" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-text-500 uppercase tracking-widest">
            {isActive ? 'Currently Traveling' : 'Next Adventure'}
          </p>
          <p className="text-sm font-semibold text-text-100">{trip.name}</p>
          <p className="text-xs text-text-400">{trip.details}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-teal-400">
            {isActive ? '✈' : trip.daysUntil}
          </p>
          {!isActive && (
            <p className="text-[10px] text-text-500">days</p>
          )}
        </div>
      </div>
    </div>
  )
}
