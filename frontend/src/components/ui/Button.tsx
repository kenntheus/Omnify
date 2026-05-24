'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: `
    bg-gradient-to-r from-primary-300 to-primary-400 text-white font-semibold
    hover:from-primary-400 hover:to-primary-500 hover:shadow-brand
    active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
    transition-all duration-200
  `,
  secondary: `
    bg-white/80 text-slate-brand border border-brand-teal/30 backdrop-blur-xs font-semibold
    hover:bg-white hover:border-brand-teal/60 hover:shadow-card
    active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `,
  ghost: `
    text-slate-brand font-medium
    hover:bg-brand-aqua/30 hover:text-primary-600
    active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `,
  danger: `
    bg-red-500 text-white font-semibold
    hover:bg-red-600 hover:shadow-lg
    active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `,
  outline: `
    bg-transparent text-primary-500 border-2 border-primary-300 font-semibold
    hover:bg-primary-300/10 hover:border-primary-400
    active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `,
  link: `
    bg-transparent text-primary-500 font-medium underline-offset-4
    hover:underline hover:text-primary-600
    focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `,
}

const sizes: Record<Size, string> = {
  xs: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  sm: 'px-4 py-2 text-sm rounded-xl gap-2',
  md: 'px-6 py-3 text-sm rounded-xl gap-2',
  lg: 'px-8 py-3.5 text-base rounded-xl gap-2.5',
  xl: 'px-10 py-4 text-lg rounded-2xl gap-3',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={cn(
          'inline-flex items-center justify-center cursor-pointer select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'pointer-events-none',
          className
        )}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
export default Button
