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
    created: { icon: PlusCircle, color: 'text-sage-500 bg-sage-100' },
    completed: { icon: CheckCircle2, color: 'text-sage-600 bg-sage-100' },
    updated: { icon: Clock, color: 'text-warm-500 bg-warm-100' },
  },
  expense: {
    approved: { icon: DollarSign, color: 'text-sage-500 bg-sage-100' },
    submitted: { icon: DollarSign, color: 'text-rose-gold-500 bg-rose-gold-100' },
  },
  incident: {
    opened: { icon: AlertCircle, color: 'text-rose-gold-500 bg-rose-gold-100' },
    resolved: { icon: CheckCircle2, color: 'text-sage-500 bg-sage-100' },
  },
  chat: {
    message: { icon: MessageCircle, color: 'text-sage-500 bg-sage-100' },
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
      <div className="text-center py-8 text-warm-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-warm-300" />
        <p>No recent activity</p>
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
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors">
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconConfig.color}`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-warm-800">
          <span className="capitalize">{actionLabels[activity.action] || activity.action}</span>{' '}
          <span className="font-medium">{activity.title}</span>
        </p>
        {!compact && (
          <p className="text-xs text-warm-500 mt-0.5">
            {formatTime(activity.timestamp)}
          </p>
        )}
      </div>

      {/* Time (compact mode) */}
      {compact && (
        <span className="text-xs text-warm-400 flex-shrink-0">
          {formatTime(activity.timestamp)}
        </span>
      )}
    </div>
  )
}
