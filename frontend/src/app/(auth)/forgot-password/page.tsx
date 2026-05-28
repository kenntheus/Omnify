'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setSubmittedEmail(data.email)
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="glass-card p-8">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-xl font-bold text-slate-800">Omnify</span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-brand-aqua/40 flex items-center justify-center mb-5">
                <Mail size={22} className="text-brand-teal" />
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Forgot your password?</h2>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  No worries. Enter your email and we'll send you a reset link.
                </p>
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

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  size="lg"
                  rightIcon={<ArrowRight size={16} />}
                >
                  Send reset link
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
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="glass-card p-8 text-center">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8 justify-center">
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

              <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-slate-800 mb-6">{submittedEmail}</p>

              <p className="text-xs text-slate-400 mb-6">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-brand-teal hover:underline cursor-pointer font-medium"
                >
                  try again
                </button>
              </p>

              <Link href="/login">
                <Button variant="secondary" fullWidth leftIcon={<ArrowLeft size={15} />}>
                  Back to sign in
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
