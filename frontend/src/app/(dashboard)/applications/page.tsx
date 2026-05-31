'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Search, Calendar, MapPin, Building2,
  Plus, TrendingUp, Eye, Star, Zap, AlertCircle, Trash2,
  ChevronDown, Loader2, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { cn, getStatusConfig, formatDate, timeAgo } from '@/lib/utils'
import { applicationsAPI } from '@/lib/api'
import type { Application, ApplicationStatus, ApplicationStats, Job, Interview } from '@/types'
import toast from 'react-hot-toast'

// jobId is populated by Mongoose .populate('jobId') — it's a full Job at runtime
type PopulatedApplication = Omit<Application, 'jobId'> & { jobId: Job }

// ── Helpers ───────────────────────────────────────────────────
const LOGO_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-500 to-cyan-600',
  'from-emerald-500 to-green-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-slate-600 to-slate-800',
  'from-indigo-400 to-blue-500',
]

function getLogoColor(name: string): string {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0)
  return LOGO_GRADIENTS[code % LOGO_GRADIENTS.length]
}

function getCompanyName(company: Job['company'] | string | undefined): string {
  if (!company) return 'Unknown'
  if (typeof company === 'string') return company
  return company.name || 'Unknown'
}

function getNextStep(app: PopulatedApplication): string | null {
  const now = new Date()
  const upcoming = app.interviews
    .filter(i => !i.completed && new Date(i.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
  if (upcoming) return `${upcoming.type} interview on ${formatDate(upcoming.scheduledAt)}`
  const lastNote = [...app.timeline].reverse().find(t => t.note)
  if (lastNote) return lastNote.note!
  return null
}

// Weekly chart has no backend analytics endpoint — kept as illustrative static data
const weeklyData = [
  { week: 'W1', apps: 8, responses: 2 },
  { week: 'W2', apps: 12, responses: 4 },
  { week: 'W3', apps: 15, responses: 5 },
  { week: 'W4', apps: 10, responses: 6 },
  { week: 'W5', apps: 5, responses: 3 },
]

const statusTabs: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<PopulatedApplication[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set())
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [interviewApp, setInterviewApp] = useState<PopulatedApplication | null>(null)
  const [interviewForm, setInterviewForm] = useState({
    type: 'video' as Interview['type'],
    scheduledAt: '',
    meetingLink: '',
    interviewer: '',
    notes: '',
  })
  const [schedulingInterview, setSchedulingInterview] = useState(false)

  const load = useCallback(async (silent = false) => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        applicationsAPI.getAll({ limit: 100 }),
        applicationsAPI.getStats(),
      ])
      const all = (appsRes.data.data as PopulatedApplication[]).filter(a => a.status !== 'saved')
      setApplications(all)
      setStats(statsRes.data.data)
    } catch {
      if (!silent) setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), 30_000)
    return () => clearInterval(id)
  }, [load])

  const remove = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id))
    setApplications(prev => prev.filter(a => a._id !== id))
    try {
      await applicationsAPI.delete(id)
      toast.success('Application removed')
      const statsRes = await applicationsAPI.getStats()
      setStats(statsRes.data.data)
    } catch {
      try {
        const res = await applicationsAPI.getAll({ limit: 100 })
        setApplications((res.data.data as PopulatedApplication[]).filter(a => a.status !== 'saved'))
      } catch { /* ignore */ }
      toast.error('Failed to remove application')
    } finally {
      setDeletingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const filtered = applications.filter(a => {
    if (activeTab !== 'all' && a.status !== activeTab) return false
    if (!search) return true
    const q = search.toLowerCase()
    const title = a.jobId?.title?.toLowerCase() || ''
    const company = getCompanyName(a.jobId?.company).toLowerCase()
    return title.includes(q) || company.includes(q)
  })

  const statsCards = [
    { label: 'Total Applied', value: stats?.total ?? 0, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Review', value: stats?.pending ?? 0, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Interviews', value: stats?.interviews ?? 0, icon: Calendar, color: 'text-brand-teal', bg: 'bg-brand-aqua/30' },
    { label: 'Offers', value: stats?.offers ?? 0, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Response Rate', value: `${stats?.responseRate ?? 0}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const breakdown = stats ? [
    { label: 'Applied', count: stats.applied, color: 'bg-blue-400' },
    { label: 'Reviewing', count: stats.pending, color: 'bg-purple-400' },
    { label: 'Interview', count: stats.interviews, color: 'bg-brand-teal' },
    { label: 'Offer', count: stats.offers, color: 'bg-amber-400' },
    { label: 'Rejected', count: stats.rejected, color: 'bg-red-400' },
  ].filter(b => b.count > 0) : []
  const breakdownTotal = breakdown.reduce((s, b) => s + b.count, 0) || 1

  const tabCount = (tab: ApplicationStatus | 'all') =>
    tab === 'all' ? applications.length : applications.filter(a => a.status === tab).length

  const updateStatus = async (app: PopulatedApplication, newStatus: ApplicationStatus) => {
    setStatusMenuId(null)
    setUpdatingStatusIds(prev => new Set(prev).add(app._id))
    setApplications(prev => prev.map(a => a._id === app._id ? { ...a, status: newStatus } : a))
    try {
      await applicationsAPI.updateStatus(app._id, newStatus)
      const statsRes = await applicationsAPI.getStats()
      setStats(statsRes.data.data)
    } catch {
      setApplications(prev => prev.map(a => a._id === app._id ? { ...a, status: app.status } : a))
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatusIds(prev => { const next = new Set(prev); next.delete(app._id); return next })
    }
  }

  const scheduleInterview = async () => {
    if (!interviewApp || !interviewForm.scheduledAt) return
    setSchedulingInterview(true)
    try {
      await applicationsAPI.addInterview(interviewApp._id, {
        type: interviewForm.type,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        meetingLink: interviewForm.meetingLink || undefined,
        interviewer: interviewForm.interviewer || undefined,
        notes: interviewForm.notes || undefined,
        completed: false,
      })
      const [appsRes, statsRes] = await Promise.all([
        applicationsAPI.getAll({ limit: 100 }),
        applicationsAPI.getStats(),
      ])
      setApplications((appsRes.data.data as PopulatedApplication[]).filter(a => a.status !== 'saved'))
      setStats(statsRes.data.data)
      setShowInterviewModal(false)
      setInterviewApp(null)
      setInterviewForm({ type: 'video', scheduledAt: '', meetingLink: '', interviewer: '', notes: '' })
      toast.success('Interview scheduled!')
    } catch {
      toast.error('Failed to schedule interview')
    } finally {
      setSchedulingInterview(false)
    }
  }

  // Close status dropdown on outside click
  const STATUS_OPTIONS: ApplicationStatus[] = [
    'applied', 'pending', 'reviewing', 'phone_screen', 'interview',
    'technical', 'final_interview', 'offer', 'accepted', 'rejected', 'withdrawn',
  ]

  return (
    <div className="space-y-5" onClick={() => setStatusMenuId(null)}>
      {/* ── Interview scheduling modal ────────────────────────── */}
      <AnimatePresence>
        {showInterviewModal && interviewApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setShowInterviewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
              onClick={e => e.stopPropagation()}
            >
              <div className="glass-card p-6 shadow-glass-lg m-4">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-aqua/40 flex items-center justify-center">
                      <Calendar size={15} className="text-brand-teal" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Schedule Interview</h3>
                      <p className="text-xs text-slate-500">{interviewApp.jobId?.title || 'Unknown Position'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowInterviewModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Interview type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['phone', 'video', 'onsite', 'technical', 'panel'] as Interview['type'][]).map(t => (
                        <button
                          key={t}
                          onClick={() => setInterviewForm(p => ({ ...p, type: t }))}
                          className={cn(
                            'py-2 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer border',
                            interviewForm.type === t
                              ? 'bg-brand-teal text-white border-brand-teal'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/40'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date & time <span className="text-red-400">*</span></label>
                    <input
                      type="datetime-local"
                      value={interviewForm.scheduledAt}
                      onChange={e => setInterviewForm(p => ({ ...p, scheduledAt: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting link</label>
                    <input
                      value={interviewForm.meetingLink}
                      onChange={e => setInterviewForm(p => ({ ...p, meetingLink: e.target.value }))}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Interviewer name</label>
                    <input
                      value={interviewForm.interviewer}
                      onChange={e => setInterviewForm(p => ({ ...p, interviewer: e.target.value }))}
                      placeholder="e.g. Jane Smith, Engineering Manager"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInterviewModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={scheduleInterview}
                    disabled={!interviewForm.scheduledAt || schedulingInterview}
                    className="flex-1 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {schedulingInterview && <Loader2 size={14} className="animate-spin" />}
                    {schedulingInterview ? 'Scheduling…' : 'Schedule Interview'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Applications Tracker</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `Tracking ${applications.length} application${applications.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button leftIcon={<Plus size={15} />}>Add Application</Button>
      </div>

      {error && (
        <div className="glass-card p-5 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">Failed to load applications. Please try refreshing.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 flex-shrink-0" rounded />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-10" rounded />
                  <Skeleton className="h-3 w-20" rounded />
                </div>
              </div>
            ))
          : statsCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-3"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                  <s.icon size={16} className={s.color} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Chart + breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,182,172,0.1)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Bar dataKey="apps" fill="#64b6ac" radius={[4, 4, 0, 0]} name="Applications" />
              <Bar dataKey="responses" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Responses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Breakdown</h3>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" rounded />
                    <Skeleton className="h-3 w-6" rounded />
                  </div>
                  <Skeleton className="h-1.5 w-full" rounded />
                </div>
              ))}
            </div>
          ) : breakdown.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No applications yet</p>
          ) : (
            <div className="space-y-2.5">
              {breakdown.map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-slate-400">{row.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.count / breakdownTotal) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', row.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Applications list */}
      <div className="glass-card overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
            />
          </div>
          <div className="flex-1 overflow-x-auto scroll-hide">
            <div className="flex gap-1">
              {statusTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                    activeTab === tab.value
                      ? 'bg-brand-teal text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {tab.label}
                  {!loading && (
                    <span className="ml-1.5 opacity-60">{tabCount(tab.value)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[1fr_140px_120px_120px_80px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500">Position</span>
          <span className="text-xs font-semibold text-slate-500">Status</span>
          <span className="text-xs font-semibold text-slate-500">Applied</span>
          <span className="text-xs font-semibold text-slate-500">Updated</span>
          <span />
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="w-10 h-10 flex-shrink-0" rounded />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" rounded />
                  <Skeleton className="h-3 w-32" rounded />
                </div>
                <Skeleton className="hidden lg:block h-5 w-20" rounded />
                <Skeleton className="hidden lg:block h-3 w-20" rounded />
                <Skeleton className="hidden lg:block h-3 w-16" rounded />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <ClipboardList size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600">
                    {applications.length === 0 ? 'No applications yet' : 'No applications match your search'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {applications.length === 0
                      ? 'Apply to jobs to track them here'
                      : 'Try adjusting your search or filters'}
                  </p>
                </div>
              ) : (
                filtered.map((app, i) => {
                  const job = app.jobId
                  const companyName = getCompanyName(job?.company)
                  const logoColor = getLogoColor(companyName)
                  const sc = getStatusConfig(app.status)
                  const nextStep = getNextStep(app)

                  return (
                    <motion.div
                      key={app._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.2) }}
                      layout
                      className="flex flex-col lg:grid lg:grid-cols-[1fr_140px_120px_120px_80px] gap-3 lg:gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Position */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {companyName[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {job?.title || 'Unknown Position'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1"><Building2 size={10} />{companyName}</span>
                            {job?.location && (
                              <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                            )}
                            {app.automatedApply && (
                              <span className="flex items-center gap-1 text-brand-teal"><Zap size={10} />Auto</span>
                            )}
                          </div>
                          {nextStep && (
                            <p className="text-xs text-brand-teal mt-0.5 truncate">→ {nextStep}</p>
                          )}
                        </div>
                      </div>

                      {/* Status — click to update */}
                      <div className="flex items-center relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setStatusMenuId(statusMenuId === app._id ? null : app._id)}
                          disabled={updatingStatusIds.has(app._id)}
                          className={cn('badge text-xs cursor-pointer hover:opacity-80 transition-opacity flex items-center', sc.bg, sc.color)}
                        >
                          {updatingStatusIds.has(app._id)
                            ? <Loader2 size={10} className="animate-spin mr-1.5" />
                            : <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0', sc.dot)} />
                          }
                          {sc.label}
                          <ChevronDown size={9} className="ml-1 flex-shrink-0" />
                        </button>

                        <AnimatePresence>
                          {statusMenuId === app._id && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.97 }}
                              transition={{ duration: 0.12 }}
                              className="absolute top-full left-0 mt-1 z-30 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[170px] max-h-60 overflow-y-auto"
                            >
                              {STATUS_OPTIONS.filter(s => s !== app.status).map(status => {
                                const cfg = getStatusConfig(status)
                                return (
                                  <button
                                    key={status}
                                    onClick={() => updateStatus(app, status)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                                    {cfg.label}
                                  </button>
                                )
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Applied */}
                      <div className="flex items-center">
                        <span className="text-xs text-slate-500">
                          {app.appliedAt ? formatDate(app.appliedAt) : '—'}
                        </span>
                      </div>

                      {/* Updated */}
                      <div className="flex items-center">
                        <span className="text-xs text-slate-400">{timeAgo(app.updatedAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="hidden lg:flex items-center justify-end gap-1">
                        {['applied', 'reviewing', 'phone_screen', 'interview', 'technical'].includes(app.status) && (
                          <button
                            onClick={() => { setInterviewApp(app); setShowInterviewModal(true) }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-brand-teal hover:bg-brand-aqua/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            aria-label="Schedule interview"
                            title="Schedule interview"
                          >
                            <Calendar size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => remove(app._id)}
                          disabled={deletingIds.has(app._id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-30"
                          aria-label="Delete application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
