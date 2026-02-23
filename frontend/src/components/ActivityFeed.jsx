import {
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  MessageCircle,
  DollarSign,
  Clock,
} from 'lucide-react'

const activityIcons = {
  assignment: {
    created: { icon: PlusCircle, color: 'text-teal-400 bg-teal-500/10' },
    completed: { icon: CheckCircle2, color: 'text-teal-400 bg-teal-500/10' },
    updated: { icon: Clock, color: 'text-text-400 bg-dark-500' },
  },
  expense: {
    approved: { icon: DollarSign, color: 'text-gold-400 bg-gold-500/10' },
    submitted: { icon: DollarSign, color: 'text-gold-400 bg-gold-500/10' },
  },
  incident: {
    opened: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10' },
    resolved: { icon: CheckCircle2, color: 'text-teal-400 bg-teal-500/10' },
  },
  chat: {
    message: { icon: MessageCircle, color: 'text-text-400 bg-dark-500' },
  },
}

const actionLabels = {
  created: 'created',
  completed: 'completed',
  updated: 'updated',
  approved: 'approved',
  submitted: 'submitted',
  opened: 'opened',
  resolved: 'resolved',
  message: 'message in',
}

export default function ActivityFeed({ activities, compact = false }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-text-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-text-600" />
        <p className="text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          isLast={index === activities.length - 1}
          compact={compact}
        />
      ))}
    </div>
  )
}

function ActivityItem({ activity, isLast, compact }) {
  const iconConfig =
    activityIcons[activity.type]?.[activity.action] ||
    activityIcons.assignment.updated

  const Icon = iconConfig.icon

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-dark-600/40 transition-colors">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconConfig.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-300">
          <span className="capitalize">{actionLabels[activity.action] || activity.action}</span>{' '}
          <span className="font-medium text-text-200">{activity.title}</span>
        </p>
        {!compact && (
          <p className="text-[10px] text-text-500 mt-0.5">
            {formatTime(activity.timestamp)}
          </p>
        )}
      </div>

      {compact && (
        <span className="text-[10px] text-text-500 flex-shrink-0">
          {formatTime(activity.timestamp)}
        </span>
      )}
    </div>
  )
}
