'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const steps = ['Account', 'Profile', 'Ready']

export default function RegisterPage() {
  const router = useRouter()
  const { register: authRegister, isLoading } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const passwordStrength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strengthScore = passwordStrength.filter(Boolean).length

  const onSubmit = async (data: FormData) => {
    try {
      await authRegister(data.name, data.email, data.password)
      toast.success('Account created! Welcome to Omnify 🎉')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Registration failed')
    }
  }

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">Omnify</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Create your account</h1>
        <p className="text-slate-500 text-sm mb-7">Start your AI-powered job search journey</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Full name"
            type="text"
            placeholder="Jane Smith"
            error={errors.name?.message}
            autoComplete="name"
            {...register('name')}
          />

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />

            {/* Password strength */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        i <= strengthScore
                          ? strengthScore <= 1 ? 'bg-red-400'
                          : strengthScore === 2 ? 'bg-amber-400'
                          : strengthScore === 3 ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: '8+ characters', met: password.length >= 8 },
                    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                    { label: 'Number', met: /[0-9]/.test(password) },
                    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
                  ].map((req) => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${req.met ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        {req.met && <Check size={8} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-xs ${req.met ? 'text-emerald-600' : 'text-slate-400'}`}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 mt-0.5 rounded border-brand-teal/30 text-brand-teal accent-brand-teal flex-shrink-0"
              {...register('agreeToTerms')}
            />
            <span className="text-sm text-slate-600">
              I agree to the{' '}
              <Link href="/terms" className="text-brand-teal font-medium hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-brand-teal font-medium hover:underline">Privacy Policy</Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-red-500 -mt-2">{errors.agreeToTerms.message}</p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            size="lg"
            rightIcon={<ArrowRight size={16} />}
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-teal font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
