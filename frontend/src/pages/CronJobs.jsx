import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import {
  Clock,
  Calendar,
  Gift,
  Plane,
  Home,
  Heart,
  Bell,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'

const getJobIcon = (name) => {
  if (name.includes('birthday') || name.includes('🎂')) return Gift
  if (name.includes('trip') || name.includes('✈️') || name.includes('🚢') || name.includes('🇮🇹')) return Plane
  if (name.includes('visit') || name.includes('🏠')) return Home
  if (name.includes('Anniversary') || name.includes('💍')) return Heart
  return Bell
}

const getJobColor = (name) => {
  if (name.includes('🚨')) return 'border-red-300 bg-red-50'
  if (name.includes('birthday') || name.includes('🎂')) return 'border-pink-200 bg-pink-50'
  if (name.includes('trip') || name.includes('✈️') || name.includes('🚢') || name.includes('🇮🇹')) return 'border-blue-200 bg-blue-50'
  if (name.includes('visit') || name.includes('🏠')) return 'border-purple-200 bg-purple-50'
  if (name.includes('Anniversary') || name.includes('💍')) return 'border-rose-200 bg-rose-50'
  return 'border-sage-200 bg-sage-50'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getTimeUntil = (dateStr) => {
  if (!dateStr) return null
  const now = new Date()
  const target = new Date(dateStr)
  const diff = target - now
  
  if (diff < 0) return 'Past'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return 'Soon'
}

export default function CronJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/cron`)
      const data = await res.json()
      setJobs(data)
      if (data.length > 0 && data[0].synced_at) {
        setLastSync(data[0].synced_at)
      }
    } catch (err) {
      console.error('Failed to fetch cron jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    if (filter === 'daily') return job.schedule?.kind === 'cron'
    if (filter === 'upcoming') return job.schedule?.kind === 'at'
    if (filter === 'birthdays') return job.name.includes('birthday') || job.name.includes('🎂')
    if (filter === 'trips') return job.name.includes('trip') || job.name.includes('✈️') || job.name.includes('🚢') || job.name.includes('🇮🇹')
    return true
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aDate = a.next_run ? new Date(a.next_run) : new Date('2099-12-31')
    const bDate = b.next_run ? new Date(b.next_run) : new Date('2099-12-31')
    return aDate - bDate
  })

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
          <h1 className="page-title">Scheduled Jobs</h1>
          <p className="text-warm-500 mt-1">
            {jobs.length} automated reminders and tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-xs text-warm-400">
              Synced: {formatDate(lastSync)}
            </span>
          )}
          <button
            onClick={fetchJobs}
            className="p-2 rounded-lg hover:bg-cream-100 text-warm-500"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'daily', label: 'Daily' },
          { key: 'upcoming', label: 'One-time' },
          { key: 'birthdays', label: '🎂 Birthdays' },
          { key: 'trips', label: '✈️ Trips' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-sage-500 text-white'
                : 'bg-cream-100 text-warm-600 hover:bg-cream-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-sage-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-800">
                {jobs.filter(j => j.schedule?.kind === 'cron').length}
              </p>
              <p className="text-xs text-warm-500">Recurring</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-800">
                {jobs.filter(j => j.schedule?.kind === 'at').length}
              </p>
              <p className="text-xs text-warm-500">One-time</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-800">
                {jobs.filter(j => j.name.includes('🎂') || j.name.includes('birthday')).length}
              </p>
              <p className="text-xs text-warm-500">Birthdays</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Plane className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-800">
                {jobs.filter(j => j.name.includes('✈️') || j.name.includes('🚢') || j.name.includes('🇮🇹') || j.name.includes('trip')).length}
              </p>
              <p className="text-xs text-warm-500">Trips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {sortedJobs.map((job) => {
          const Icon = getJobIcon(job.name)
          const colorClass = getJobColor(job.name)
          const timeUntil = getTimeUntil(job.next_run)
          
          return (
            <div
              key={job.id}
              className={`bg-white rounded-xl border ${colorClass} p-4 hover:shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    job.enabled ? 'bg-white' : 'bg-warm-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${job.enabled ? 'text-warm-600' : 'text-warm-400'}`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${job.enabled ? 'text-warm-800' : 'text-warm-400'}`}>
                      {job.name}
                    </h3>
                    <p className="text-sm text-warm-500 mt-0.5">
                      {job.payload_summary}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-warm-700">
                      {formatDate(job.next_run)}
                    </p>
                    {timeUntil && (
                      <p className={`text-xs ${
                        timeUntil === 'Past' ? 'text-warm-400' :
                        timeUntil === 'Soon' ? 'text-red-500 font-medium' :
                        'text-sage-600'
                      }`}>
                        {timeUntil}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {job.enabled ? (
                      <CheckCircle2 className="w-5 h-5 text-sage-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-warm-300" />
                    )}
                  </div>
                </div>
              </div>
              
              {job.last_run && (
                <div className="mt-3 pt-3 border-t border-cream-100 flex items-center gap-2 text-xs text-warm-400">
                  <span>Last run: {formatDate(job.last_run)}</span>
                  {job.last_status && (
                    <span className={`px-2 py-0.5 rounded-full ${
                      job.last_status === 'ok' ? 'bg-sage-100 text-sage-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {job.last_status}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sortedJobs.length === 0 && (
        <div className="text-center py-12 text-warm-400">
          No jobs match this filter
        </div>
      )}
    </div>
  )
}
