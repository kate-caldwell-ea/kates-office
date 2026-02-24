import { API_URL } from '../config.js';
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  AlertCircle,
  Zap,
} from 'lucide-react'

const categoryMap = {
  brief: { label: 'Briefs', icon: Zap, color: 'text-teal-400', bg: 'bg-teal-500/15' },
  birthday: { label: 'Birthdays', icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  trip: { label: 'Trips', icon: Plane, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  monitor: { label: 'Monitors', icon: AlertCircle, color: 'text-gold-400', bg: 'bg-gold-500/15' },
  maintenance: { label: 'Maintenance', icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  other: { label: 'Other', icon: Bell, color: 'text-text-400', bg: 'bg-dark-500' },
}

const getJobCategory = (job) => {
  if (job.name.includes('birthday') || job.name.includes('🎂')) return 'birthday'
  if (job.name.includes('trip') || job.name.includes('✈️') || job.name.includes('🚢') || job.name.includes('🇮🇹')) return 'trip'
  if (job.name.includes('brief') || job.name.includes('morning') || job.name.includes('evening')) return 'brief'
  if (job.name.includes('monitor') || job.name.includes('check') || job.name.includes('🚨')) return 'monitor'
  if (job.name.includes('visit') || job.name.includes('🏠') || job.name.includes('maintenance')) return 'maintenance'
  return 'other'
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

  if (diff < 0) return { text: 'Past', color: 'text-text-500' }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 7) return { text: `${days}d`, color: 'text-text-400' }
  if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-teal-400' }
  if (hours > 0) return { text: `${hours}h`, color: 'text-gold-400' }
  return { text: 'Soon', color: 'text-red-400 font-semibold' }
}

const statusBadge = (status) => {
  if (!status) return null
  const configs = {
    ok: { label: 'Success', color: 'bg-teal-500/15 text-teal-400' },
    success: { label: 'Success', color: 'bg-teal-500/15 text-teal-400' },
    failed: { label: 'Failed', color: 'bg-red-500/15 text-red-400' },
    error: { label: 'Error', color: 'bg-red-500/15 text-red-400' },
    skipped: { label: 'Skipped', color: 'bg-dark-400 text-text-400' },
  }
  const cfg = configs[status] || configs.skipped
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function CronJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
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

  const syncFromOpenClaw = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`${API_URL}/cron/sync`, { method: 'POST' })
      const data = await res.json()
      if (data.jobs) {
        setJobs(data.jobs)
        setLastSync(new Date().toISOString())
      }
    } catch (err) {
      console.error('Failed to sync cron jobs:', err)
    } finally {
      setSyncing(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return getJobCategory(job) === filter
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aDate = a.next_run ? new Date(a.next_run) : new Date('2099-12-31')
    const bDate = b.next_run ? new Date(b.next_run) : new Date('2099-12-31')
    return aDate - bDate
  })

  // Group by category
  const grouped = {}
  sortedJobs.forEach(job => {
    const cat = getJobCategory(job)
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(job)
  })

  // Stats
  const recurring = jobs.filter(j => j.schedule?.kind === 'cron').length
  const oneTime = jobs.filter(j => j.schedule?.kind === 'at').length
  const enabled = jobs.filter(j => j.enabled).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-200 flex items-center gap-3">
            <Clock className="w-7 h-7 text-teal-400" />
            Scheduled Jobs
          </h1>
          <p className="text-text-400 mt-1">
            {jobs.length} automated reminders and tasks from OpenClaw
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-xs text-text-500">
              Synced: {formatDate(lastSync)}
            </span>
          )}
          <button
            onClick={syncFromOpenClaw}
            disabled={syncing}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-200">{recurring}</p>
              <p className="text-xs text-text-400">Recurring</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-200">{oneTime}</p>
              <p className="text-xs text-text-400">One-time</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-200">{enabled}</p>
              <p className="text-xs text-text-400">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'brief', label: 'Briefs' },
          { key: 'birthday', label: 'Birthdays' },
          { key: 'trip', label: 'Trips' },
          { key: 'monitor', label: 'Monitors' },
          { key: 'maintenance', label: 'Maintenance' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-dark-600/60 text-text-400 border border-dark-300/20 hover:bg-dark-500/60 hover:text-text-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped Jobs */}
      {filter === 'all' ? (
        Object.entries(grouped).map(([cat, catJobs]) => {
          const catInfo = categoryMap[cat] || categoryMap.other
          const CatIcon = catInfo.icon
          return (
            <div key={cat} className="space-y-3">
              <h2 className="text-sm font-medium text-text-400 uppercase tracking-wide flex items-center gap-2">
                <CatIcon className={`w-4 h-4 ${catInfo.color}`} />
                {catInfo.label} ({catJobs.length})
              </h2>
              <div className="space-y-2">
                {catJobs.map((job, i) => (
                  <JobCard key={job.id} job={job} cat={cat} index={i} />
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="space-y-2">
          {sortedJobs.map((job, i) => (
            <JobCard key={job.id} job={job} cat={getJobCategory(job)} index={i} />
          ))}
        </div>
      )}

      {sortedJobs.length === 0 && (
        <div className="card text-center py-12">
          <Clock className="w-12 h-12 text-text-600 mx-auto mb-3" />
          <p className="text-text-400 text-lg">No jobs match this filter</p>
          <p className="text-text-500 text-sm mt-1">Try syncing from OpenClaw or changing the filter</p>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="card text-center py-12">
          <Clock className="w-12 h-12 text-text-600 mx-auto mb-3" />
          <h3 className="text-text-300 text-lg font-medium">No scheduled jobs yet</h3>
          <p className="text-text-500 text-sm mt-1">
            Click "Sync" to pull jobs from OpenClaw, or they'll appear when Kate schedules them.
          </p>
        </div>
      )}
    </div>
  )
}

function JobCard({ job, cat, index }) {
  const catInfo = categoryMap[cat] || categoryMap.other
  const CatIcon = catInfo.icon
  const timeUntil = getTimeUntil(job.next_run)

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="card card-hover"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${catInfo.bg}`}>
            <CatIcon className={`w-5 h-5 ${catInfo.color}`} />
          </div>
          <div className="min-w-0">
            <h3 className={`text-base font-medium truncate ${job.enabled ? 'text-text-200' : 'text-text-500'}`}>
              {job.name}
            </h3>
            {job.payload_summary && (
              <p className="text-sm text-text-400 mt-0.5 truncate">{job.payload_summary}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Next Run */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-300">
              {formatDate(job.next_run)}
            </p>
            {timeUntil && (
              <p className={`text-xs ${timeUntil.color}`}>
                {timeUntil.text}
              </p>
            )}
          </div>

          {/* Status Badge */}
          {job.last_status && statusBadge(job.last_status)}

          {/* Enabled/Disabled */}
          {job.enabled ? (
            <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-text-600 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Last run info on mobile */}
      {job.last_run && (
        <div className="mt-3 pt-3 border-t border-dark-300/20 flex items-center gap-3 text-xs text-text-500">
          <span>Last run: {formatDate(job.last_run)}</span>
          {job.last_status && statusBadge(job.last_status)}
        </div>
      )}
    </motion.div>
  )
}
