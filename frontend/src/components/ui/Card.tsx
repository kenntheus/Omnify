'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'flat'
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const variants = {
  default: 'bg-white/80 backdrop-blur-glass border border-white/50 shadow-card',
  glass: 'bg-white/60 backdrop-blur-glass border border-white/40 shadow-glass',
  elevated: 'bg-white shadow-card-hover border border-slate-100',
  bordered: 'bg-white border-2 border-brand-teal/20',
  flat: 'bg-slate-50/80',
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

export default function Card({
  variant = 'default',
  hover = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 12px 40px rgba(93,115,126,0.15)' } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        hover && 'cursor-pointer transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
