'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import CountUp from 'react-countup'

interface StatsCardProps {
  title: string
  value: number | string
  unit?: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  prefix?: string
  suffix?: string
  delay?: number
  animated?: boolean
}

export default function StatsCard({
  title, value, unit, change, changeLabel, icon: Icon,
  iconColor = 'text-brand-teal', iconBg = 'bg-brand-aqua/40',
  prefix, suffix, delay = 0, animated = true,
}: StatsCardProps) {
  const positive = typeof change === 'number' && change > 0
  const negative = typeof change === 'number' && change < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        {typeof change === 'number' && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            positive ? 'text-emerald-700 bg-emerald-50' : negative ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'
          )}>
            {positive ? <TrendingUp size={12} /> : negative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {positive && '+'}{change}%
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">
          {prefix}
          {animated && typeof value === 'number' ? (
            <CountUp end={value} duration={1.5} separator="," />
          ) : value}
          {suffix || unit}
        </p>
        {changeLabel && (
          <p className="text-xs text-slate-400 mt-1">{changeLabel}</p>
        )}
      </div>
    </motion.div>
  )
}
