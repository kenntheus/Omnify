import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'teal' | 'purple' | 'slate'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  error: 'bg-red-50 text-red-700 border border-red-200/50',
  info: 'bg-sky-50 text-sky-700 border border-sky-200/50',
  teal: 'bg-brand-aqua/60 text-primary-700 border border-brand-teal/20',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200/50',
  slate: 'bg-slate-100 text-slate-600 border border-slate-200/50',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
  teal: 'bg-primary-400',
  purple: 'bg-purple-500',
  slate: 'bg-slate-400',
}

export default function Badge({ variant = 'default', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} aria-hidden />
      )}
      {children}
    </span>
  )
}
