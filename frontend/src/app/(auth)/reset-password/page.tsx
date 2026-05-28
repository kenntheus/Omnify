'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, ArrowLeft, Lock, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authAPI } from '@/lib/api'

const schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid reset link</h2>
        <p className="text-sm text-slate-500 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password">
          <Button fullWidth>Request a new link</Button>
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authAPI.resetPassword(token, data.password)
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Reset failed. The link may have expired.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">Omnify</span>
        </div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, type: 'spring' }}
          className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle size={30} className="text-emerald-500" />
        </motion.div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Password reset!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Your password has been updated. Redirecting you to sign in&hellip;
        </p>
        <Link href="/login">
          <Button fullWidth leftIcon={<ArrowLeft size={15} />}>Go to sign in</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800">Omnify</span>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-brand-aqua/40 flex items-center justify-center mb-5">
        <Lock size={22} className="text-brand-teal" />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Set new password</h2>
        <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
          Create a strong new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="New password"
          type="password"
          placeholder="Create a strong password"
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="lg"
          rightIcon={<ArrowRight size={16} />}
        >
          Reset password
        </Button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <Suspense fallback={
        <div className="glass-card p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
