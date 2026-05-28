'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Briefcase, ClipboardList, Calendar, FileText,
  Sparkles, Check, Trash2, CheckCheck, AlertCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn, timeAgo } from '@/lib/utils'
import { notificationsAPI } from '@/lib/api'
import type { Notification } from '@/types'

// ── Type config mapped to backend type strings ────────────────
const typeConfig: Record<
  Notification['type'],
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  job_match:           { icon: Briefcase,     bg: 'bg-blue-50',         color: 'text-blue-600',    label: 'Job Match'    },
  application_update:  { icon: ClipboardList, bg: 'bg-purple-50',       color: 'text-purple-600',  label: 'Application'  },
  interview_reminder:  { icon: Calendar,      bg: 'bg-brand-aqua/40',   color: 'text-brand-teal',  label: 'Interview'    },
  system:              { icon: Bell,          bg: 'bg-slate-100',       color: 'text-slate-600',   label: 'System'       },
  tip:                 { icon: Sparkles,      bg: 'bg-emerald-50',      color: 'text-emerald-600', label: 'AI Insight'   },
}

const filterTabs = [
  { value: 'all',                label: 'All'          },
  { value: 'unread',             label: 'Unread'       },
  { value: 'job_match',          label: 'Job Matches'  },
  { value: 'application_update', label: 'Applications' },
  { value: 'interview_reminder', label: 'Interviews'   },
]

const groupLabels = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' }

function getDateGroup(createdAt: string): 'today' | 'yesterday' | 'earlier' {
  const d = new Date(createdAt)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000)
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (dStart >= todayStart) return 'today'
  if (dStart >= yesterdayStart) return 'yesterday'
  return 'earlier'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    notificationsAPI.getAll({ limit: 50 })
      .then(res => setNotifications(res.data.data as Notification[]))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'all') return true
    return n.type === filter
  })

  const groups = (['today', 'yesterday', 'earlier'] as const)
    .map(date => ({ date, items: filtered.filter(n => getDateGroup(n.createdAt) === date) }))
    .filter(g => g.items.length > 0)

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    try { await notificationsAPI.markRead(id) } catch { /* optimistic-only */ }
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try { await notificationsAPI.markAllRead() } catch { /* optimistic-only */ }
  }

  const remove = async (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id))
    try { await notificationsAPI.delete(id) } catch { /* optimistic-only */ }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <h1 className="page-title">Notifications</h1>
            {!loading && unreadCount > 0 && <Badge variant="error">{unreadCount} unread</Badge>}
          </div>
          <p className="page-subtitle">Stay updated on your job search activity</p>
        </div>
        {!loading && unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck size={14} />}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scroll-hide pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer',
              filter === tab.value
                ? 'bg-brand-teal text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-teal/40 hover:text-slate-800'
            )}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-5 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">Failed to load notifications. Please try refreshing.</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="glass-card divide-y divide-slate-50 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4">
              <Skeleton className="w-10 h-10 flex-shrink-0" rounded />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-48" rounded />
                <Skeleton className="h-3 w-full" rounded />
                <Skeleton className="h-3 w-24" rounded />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification groups */}
      {!loading && !error && (
        groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card py-20 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'unread' ? "You're all caught up!" : 'Nothing here yet'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {groups.map(group => (
              <div key={group.date}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  {groupLabels[group.date]}
                </p>
                <div className="glass-card divide-y divide-slate-50 overflow-hidden">
                  <AnimatePresence initial={false}>
                    {group.items.map(n => {
                      const cfg = typeConfig[n.type] ?? typeConfig.system
                      const Icon = cfg.icon
                      return (
                        <motion.div
                          key={n._id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'flex items-start gap-4 px-5 py-4 group transition-colors',
                            !n.read ? 'bg-brand-aqua/10 hover:bg-brand-aqua/15' : 'hover:bg-slate-50/80'
                          )}
                        >
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                            <Icon size={16} className={cfg.color} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={cn('text-sm', !n.read ? 'font-semibold text-slate-800' : 'font-medium text-slate-700')}>
                                    {n.title}
                                  </p>
                                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {cfg.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-slate-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.read && (
                                <div className="w-2 h-2 bg-brand-teal rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                            {!n.read && (
                              <button
                                onClick={() => markRead(n._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-teal hover:bg-brand-aqua/30 transition-colors cursor-pointer"
                                aria-label="Mark as read"
                              >
                                <Check size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => remove(n._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              aria-label="Remove"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
