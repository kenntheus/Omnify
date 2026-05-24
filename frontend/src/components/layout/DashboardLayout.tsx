'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Save collapse state
  useEffect(() => {
    const saved = localStorage.getItem('omnify-sidebar-collapsed')
    if (saved) setCollapsed(JSON.parse(saved))
  }, [])

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('omnify-sidebar-collapsed', JSON.stringify(next))
  }

  return (
    <div className="min-h-dvh bg-mesh bg-brand-white">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header
        sidebarCollapsed={collapsed}
        onMobileMenuOpen={() => setMobileOpen(true)}
      />

      <motion.main
        className={cn(
          'pt-16 min-h-dvh transition-all duration-250',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
        layout
      >
        <div className="px-4 md:px-6 py-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
