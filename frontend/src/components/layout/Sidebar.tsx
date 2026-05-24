'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Briefcase, Bookmark, ClipboardList,
  BrainCircuit, Settings, LogOut, ChevronLeft, ChevronRight,
  Bell, Crown, Sparkles, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { initials } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/resume', icon: FileText, label: 'Resume Analyzer' },
  { href: '/jobs', icon: Briefcase, label: 'Job Search' },
  { href: '/saved-jobs', icon: Bookmark, label: 'Saved Jobs' },
  { href: '/applications', icon: ClipboardList, label: 'Applications' },
  { href: '/career-assistant', icon: BrainCircuit, label: 'AI Assistant' },
]

const bottomItems = [
  { href: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-white/8',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center flex-shrink-0 shadow-brand">
            <Sparkles size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-lg tracking-tight">Omnify</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Upgrade banner */}
      {!collapsed && user?.subscription === 'free' && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-gradient-to-br from-brand-teal/20 to-primary-500/10 border border-brand-teal/20">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-brand-teal" />
            <span className="text-xs font-semibold text-brand-teal">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-slate-400 mb-2.5">
            Unlock unlimited applications & AI features
          </p>
          <Link
            href="/settings?tab=billing"
            className="block text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-brand-teal text-white hover:bg-primary-400 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scroll-hide" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center rounded-xl transition-all duration-200 group relative',
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-brand-teal/15 text-brand-teal'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-teal rounded-full"
                />
              )}
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg
                               opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
                               transition-opacity duration-150">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-white/8 space-y-1">
        {bottomItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center rounded-xl transition-all duration-200 group relative',
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                active ? 'bg-brand-teal/15 text-brand-teal' : 'text-slate-400 hover:bg-white/8 hover:text-white'
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {/* User card */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1',
          collapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user ? initials(user.name) : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.subscription || 'free'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-sidebar border-r border-white/8 z-40 overflow-hidden"
        aria-label="Sidebar"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
              onClick={onMobileClose}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[260px] bg-sidebar z-50"
            >
              <div className="absolute right-3 top-4">
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
