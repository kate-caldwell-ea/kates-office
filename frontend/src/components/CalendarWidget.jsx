import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import { Calendar, Gift, Plane, Heart, Clock, Stethoscope, Users, DollarSign } from 'lucide-react'

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

  useEffect(() => {
    fetch(`${API_URL}/calendar`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-40 bg-cream-200 rounded-lg"></div>
      </div>
    )
  }

  if (!data) return null

  const upcomingEvents = data.events?.slice(0, 4) || []

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-warm-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sage-500" />
          Upcoming
        </h3>
      </div>
      
      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-warm-400 text-center py-4">No upcoming events</p>
        ) : (
          upcomingEvents.map((event, i) => {
            const Icon = eventTypeIcons[event.type] || Calendar
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-sage-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-800 truncate">{event.title}</p>
                  {event.time && (
                    <p className="text-xs text-warm-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.time}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    event.daysUntil === 0 
                      ? 'bg-sage-100 text-sage-700' 
                      : event.daysUntil <= 3 
                        ? 'bg-rose-gold-100 text-rose-gold-700'
                        : 'bg-cream-100 text-warm-600'
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
        <div className="h-32 bg-cream-200 rounded-lg"></div>
      </div>
    )
  }

  if (birthdays.length === 0) return null

  return (
    <div className="card bg-gradient-to-br from-rose-gold-50 to-pink-50 border-rose-gold-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-warm-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-rose-gold-500" />
          Birthdays
        </h3>
      </div>
      
      <div className="space-y-2">
        {birthdays.map((birthday, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎂</span>
              <div>
                <p className="text-sm font-medium text-warm-800">{birthday.name}</p>
                <p className="text-xs text-warm-500 capitalize">{birthday.relation}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${
                birthday.daysUntil <= 7 ? 'text-rose-gold-600' : 'text-warm-600'
              }`}>
                {birthday.daysUntil === 0 ? '🎉 Today!' : 
                 birthday.daysUntil === 1 ? 'Tomorrow' : 
                 `${birthday.daysUntil} days`}
              </span>
              {birthday.turning && (
                <p className="text-xs text-warm-400">Turning {birthday.turning}</p>
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
        // Show chronologically next trip, not highlighted one
        const nextTrip = data.trips?.sort((a, b) => a.daysUntil - b.daysUntil)?.[0]
        setTrip(nextTrip)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !trip) return null

  const isActive = trip.isActive

  return (
    <div className={`card ${
      trip.type === 'international' 
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          trip.type === 'international' ? 'bg-emerald-100' : 'bg-blue-100'
        }`}>
          <Plane className={`w-6 h-6 ${
            trip.type === 'international' ? 'text-emerald-600' : 'text-blue-600'
          }`} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-warm-500 uppercase tracking-wide">
            {isActive ? '✈️ Currently Traveling' : 'Next Adventure'}
          </p>
          <p className="font-semibold text-warm-800">{trip.name}</p>
          <p className="text-sm text-warm-600">{trip.details}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${
            trip.type === 'international' ? 'text-emerald-600' : 'text-blue-600'
          }`}>
            {isActive ? '🌍' : trip.daysUntil}
          </p>
          {!isActive && (
            <p className="text-xs text-warm-500">days to go</p>
          )}
        </div>
      </div>
    </div>
  )
}
