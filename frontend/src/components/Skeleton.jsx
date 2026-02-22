export function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`skeleton ${className}`}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function KanbanCardSkeleton() {
  return (
    <div className="kanban-card animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-cream-50 animate-pulse">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export function ExpenseSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sage-400 to-sage-500 rounded-2xl p-6 animate-pulse">
        <Skeleton className="h-7 w-64 bg-white/20 mb-2" />
        <Skeleton className="h-4 w-48 bg-white/20" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export default Skeleton
