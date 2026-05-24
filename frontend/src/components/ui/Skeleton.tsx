import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  rounded?: boolean
  circle?: boolean
}

export default function Skeleton({ className, rounded = false, circle = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%]',
        'animate-shimmer',
        circle ? 'rounded-full' : rounded ? 'rounded-xl' : 'rounded-lg',
        className
      )}
      aria-hidden
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton circle className="w-10 h-10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" rounded />
          <Skeleton className="h-3 w-1/2" rounded />
        </div>
      </div>
      <Skeleton className="h-3 w-full" rounded />
      <Skeleton className="h-3 w-5/6" rounded />
      <Skeleton className="h-3 w-4/6" rounded />
    </div>
  )
}

export function SkeletonJobCard() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton circle className="w-12 h-12" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" rounded />
            <Skeleton className="h-3 w-28" rounded />
          </div>
        </div>
        <Skeleton className="h-6 w-16" rounded />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" rounded />
        <Skeleton className="h-5 w-24" rounded />
        <Skeleton className="h-5 w-16" rounded />
      </div>
      <Skeleton className="h-3 w-full" rounded />
      <Skeleton className="h-3 w-4/5" rounded />
    </div>
  )
}
