import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Omnify — AI-Powered Job Automation Platform',
    template: '%s | Omnify',
  },
  description:
    'Omnify is your intelligent career assistant. Discover jobs, optimize your resume, automate applications, and track your hiring journey with AI-powered tools.',
  keywords: [
    'job search', 'AI resume', 'job automation', 'career assistant',
    'application tracker', 'cover letter generator', 'job recommendations',
  ],
  authors: [{ name: 'Omnify' }],
  creator: 'Omnify',
  metadataBase: new URL('https://omnify.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://omnify.ai',
    title: 'Omnify — AI-Powered Job Automation Platform',
    description: 'Your intelligent career assistant powered by AI.',
    siteName: 'Omnify',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omnify — AI-Powered Job Automation',
    description: 'Discover jobs, optimize resumes, automate applications with AI.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#64b6ac',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(100,182,172,0.25)',
              borderRadius: '12px',
              color: '#1e2830',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#64b6ac', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
