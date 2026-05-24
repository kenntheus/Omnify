'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Chrome } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

const features = [
  'AI-powered resume analyzer & ATS scoring',
  'Smart job matching with compatibility scores',
  'One-click automated job applications',
  'Real-time application tracking dashboard',
]

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [demoLoading, setDemoLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed')
    }
  }

  const loginDemo = async () => {
    setDemoLoading(true)
    try {
      await login('demo@omnify.ai', 'Demo@12345')
      toast.success('Welcome! Exploring with demo account.')
      router.push('/dashboard')
    } catch {
      // For demo purposes without backend, redirect anyway
      router.push('/dashboard')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
      {/* Left — branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:block"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">Omnify</span>
        </div>

        <h1 className="text-4xl font-bold text-slate-800 leading-tight mb-4">
          Your AI-powered
          <span className="gradient-text block">career co-pilot</span>
        </h1>

        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          Land your dream job faster with intelligent automation, resume optimization, and personalized insights.
        </p>

        <div className="space-y-3">
          {features.map((f, i) => (
            <motion.div
              key={f}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-brand-teal" />
              </div>
              <span className="text-sm text-slate-600">{f}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            { value: '50K+', label: 'Job seekers' },
            { value: '94%', label: 'Match accuracy' },
            { value: '3x', label: 'Faster hiring' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right — form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="glass-card p-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Omnify</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to continue your job search journey</p>
          </div>

          {/* Demo login */}
          <button
            onClick={loginDemo}
            disabled={demoLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-5 rounded-xl
                       border-2 border-dashed border-brand-teal/40 bg-brand-aqua/20 text-brand-slate
                       hover:bg-brand-aqua/40 hover:border-brand-teal/60 transition-all duration-200
                       text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {demoLoading ? (
              <div className="w-4 h-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
            ) : (
              <Sparkles size={16} className="text-brand-teal" />
            )}
            Try Demo Account — No signup needed
          </button>

          <div className="relative flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-brand-teal/30 text-brand-teal accent-brand-teal"
                  {...register('rememberMe')}
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-brand-teal hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="lg"
              rightIcon={<ArrowRight size={16} />}
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-teal font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
