'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Briefcase, ClipboardList, Calendar, FileText,
  Sparkles, Check, Trash2, CheckCheck, Filter
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type NotifType = 'job' | 'app' | 'interview' | 'resume' | 'ai'

interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  read: boolean
  time: string
  date: 'today' | 'yesterday' | 'earlier'
}

const allNotifications: Notification[] = [
  { id: '1', type: 'job', title: 'New job match!', message: 'Senior Frontend Developer at Stripe matches 96% of your profile.', read: false, time: '2 min ago', date: 'today' },
  { id: '2', type: 'app', title: 'Application viewed', message: 'Your application at Vercel was viewed by a recruiter.', read: false, time: '1 hour ago', date: 'today' },
  { id: '3', type: 'interview', title: 'Interview scheduled', message: 'Technical interview with GitHub on Dec 15 at 2:00 PM. Good luck!', read: false, time: '3 hours ago', date: 'today' },
  { id: '4', type: 'job', title: '8 new job matches', message: 'We found 8 new jobs matching your skills in React and TypeScript.', read: true, time: '5 hours ago', date: 'today' },
  { id: '5', type: 'resume', title: 'Resume analysis complete', message: 'Your resume scored 87/100. Adding "GraphQL" could boost your match rate.', read: true, time: '8 hours ago', date: 'today' },
  { id: '6', type: 'app', title: 'Application status update', message: 'Your application at Linear moved to the phone screen stage.', read: false, time: 'Yesterday, 4:30 PM', date: 'yesterday' },
  { id: '7', type: 'ai', title: 'AI career tip', message: 'Companies in your target list are actively hiring. Now is a great time to apply.', read: true, time: 'Yesterday, 11:00 AM', date: 'yesterday' },
  { id: '8', type: 'interview', title: 'Interview reminder', message: 'Your phone screen with Notion is tomorrow at 10:30 AM. Review the prep guide.', read: true, time: 'Yesterday, 9:00 AM', date: 'yesterday' },
  { id: '9', type: 'app', title: 'Application rejected', message: 'Unfortunately, OpenAI decided to move forward with other candidates.', read: true, time: 'Dec 8', date: 'earlier' },
  { id: '10', type: 'job', title: 'Saved search alert', message: '14 new jobs posted in "Full Stack Engineer" in San Francisco.', read: true, time: 'Dec 7', date: 'earlier' },
  { id: '11', type: 'resume', title: 'Resume tip', message: 'Resumes with a skills section get 40% more recruiter views. Add yours today.', read: true, time: 'Dec 5', date: 'earlier' },
]

const typeConfig: Record<NotifType, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  job: { icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600', label: 'Job Match' },
  app: { icon: ClipboardList, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Application' },
  interview: { icon: Calendar, bg: 'bg-brand-aqua/40', color: 'text-brand-teal', label: 'Interview' },
  resume: { icon: FileText, bg: 'bg-amber-50', color: 'text-amber-600', label: 'Resume' },
  ai: { icon: Sparkles, bg: 'bg-emerald-50', color: 'text-emerald-600', label: 'AI Insight' },
}

const filterTabs = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'job', label: 'Job Matches' },
  { value: 'app', label: 'Applications' },
  { value: 'interview', label: 'Interviews' },
]

const groupLabels = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(allNotifications)
  const [filter, setFilter] = useState('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'all') return true
    return n.type === filter
  })

  const groups = (['today', 'yesterday', 'earlier'] as const).map(date => ({
    date,
    items: filtered.filter(n => n.date === date),
  })).filter(g => g.items.length > 0)

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const remove = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id))

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <h1 className="page-title">Notifications</h1>
            {unreadCount > 0 && <Badge variant="error">{unreadCount} unread</Badge>}
          </div>
          <p className="page-subtitle">Stay updated on your job search activity</p>
        </div>
        {unreadCount > 0 && (
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

      {/* Notification groups */}
      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card py-20 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No notifications</p>
          <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
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
                  {group.items.map((n, i) => {
                    const cfg = typeConfig[n.type]
                    const Icon = cfg.icon
                    return (
                      <motion.div
                        key={n.id}
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
                              <p className="text-xs text-slate-400 mt-1.5">{n.time}</p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 bg-brand-teal rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                          {!n.read && (
                            <button
                              onClick={() => markRead(n.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-teal hover:bg-brand-aqua/30 transition-colors cursor-pointer"
                              title="Mark as read"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => remove(n.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove"
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
      )}
    </div>
  )
}
