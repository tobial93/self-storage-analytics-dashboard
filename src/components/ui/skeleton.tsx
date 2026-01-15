import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-primary/10',
        className
      )}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-6 pt-2">
        <div className="flex items-end gap-2" style={{ height }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-6 pt-2">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex gap-4 pb-2 border-b border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkeletonPieChart() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-6 pt-2 flex flex-col items-center">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
        <div className="mt-4 flex gap-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonChart, SkeletonTable, SkeletonPieChart }
