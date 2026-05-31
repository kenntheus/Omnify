'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[auth error]', error)
  }, [error])

  return (
    <div className="w-full max-w-md">
      <div className="glass-card p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Something went wrong</h2>
          <p className="text-sm text-slate-500">
            {error.message || 'An unexpected error occurred.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} leftIcon={<RefreshCw size={14} />} size="sm">
            Try again
          </Button>
          <Link href="/login">
            <Button variant="secondary" size="sm">Back to login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
