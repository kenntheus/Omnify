'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Search, Menu, Settings, LogOut, User, ChevronDown,
  Sparkles, Check
} from 'lucide-react'
import { cn, initials, timeAgo } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { notificationsAPI } from '@/lib/api'
import Badge from '@/components/ui/Badge'

const POLL_INTERVAL = 30_000

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/resume': 'Resume Analyzer',
  '/jobs': 'Job Search',
  '/saved-jobs': 'Saved Jobs',
  '/applications': 'Applications Tracker',
  '/career-assistant': 'AI Career Assistant',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
}

interface Notification {
  _id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type: string
  actionUrl?: string
}

interface HeaderProps {
  sidebarCollapsed: boolean
  onMobileMenuOpen: () => void
}

export default function Header({ sidebarCollapsed, onMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const pageTitle = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] || 'Omnify'

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 5 })
      setNotifications(res.data.data ?? [])
    } catch {
      // silently fail — header should never break
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setNotifications(n => n.map(x => ({ ...x, read: true })))
    } catch {
      // optimistic already applied
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-4 md:px-6 gap-4',
        'bg-white/80 backdrop-blur-glass border-b border-slate-100/80',
        'transition-all duration-250',
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
        'left-0'
      )}
    >
      {/* Left: menu + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-tight">{pageTitle}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right: search, notifs, profile */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Link
          href="/jobs"
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-400 hover:border-brand-teal/30 hover:text-slate-600 transition-all duration-200 min-w-[160px]"
        >
          <Search size={14} />
          <span>Search jobs...</span>
          <kbd className="ml-auto text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">⌘K</kbd>
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-glass rounded-2xl border border-slate-100 shadow-glass-lg overflow-hidden"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="error">{unreadCount}</Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-brand-teal hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell size={24} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={cn(
                          'flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer',
                          !n.read && 'bg-brand-aqua/10'
                        )}
                        onClick={async () => {
                          try {
                            await notificationsAPI.markRead(n._id)
                            setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x))
                          } catch {}
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal/20 to-primary-300/20 flex items-center justify-center flex-shrink-0">
                          <Sparkles size={14} className="text-brand-teal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm truncate', !n.read ? 'font-semibold text-slate-800' : 'font-medium text-slate-700')}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 bg-brand-teal rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/notifications"
                  className="block text-center text-xs font-medium text-brand-teal py-3 hover:bg-slate-50 transition-colors border-t border-slate-100"
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center text-white text-xs font-bold">
              {user ? initials(user.name) : 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown size={14} className={cn('text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-glass rounded-2xl border border-slate-100 shadow-glass-lg overflow-hidden"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  {[
                    { href: '/settings', icon: User, label: 'My Profile' },
                    { href: '/settings?tab=preferences', icon: Settings, label: 'Preferences' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      role="menuitem"
                    >
                      <item.icon size={15} className="text-slate-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={() => { setProfileOpen(false); logout() }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
