import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | Omnify',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-aqua/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-frost/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-dvh p-4">
        {children}
      </div>
    </div>
  )
}
