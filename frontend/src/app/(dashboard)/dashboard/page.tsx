'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Briefcase, FileText, ClipboardList, TrendingUp, Sparkles,
  ChevronRight, Calendar, Building2, MapPin, Zap,
  Target, ArrowUpRight, AlertCircle, CheckCircle2, Circle, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import StatsCard from '@/components/dashboard/StatsCard'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn, getStatusConfig, formatSalary, formatDateTime } from '@/lib/utils'
import { applicationsAPI, jobsAPI } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import type { ApplicationStats, Job, Application } from '@/types'

// ── Logo color helper ──────────────────────────────────────────
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

// ── Populated application type ─────────────────────────────────
type PopulatedApplication = Omit<Application, 'jobId'> & { jobId: Job }

// ── Static weekly chart data ───────────────────────────────────
const weeklyData = [
  { day: 'Mon', applied: 3, responses: 1, interviews: 0 },
  { day: 'Tue', applied: 5, responses: 2, interviews: 1 },
  { day: 'Wed', applied: 2, responses: 1, interviews: 0 },
  { day: 'Thu', applied: 7, responses: 3, interviews: 1 },
  { day: 'Fri', applied: 4, responses: 2, interviews: 2 },
  { day: 'Sat', applied: 1, responses: 0, interviews: 0 },
  { day: 'Sun', applied: 0, responses: 1, interviews: 1 },
]

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 border border-slate-100 rounded-xl shadow-glass p-3">
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-slate-700">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [greeting, setGreeting] = useState('Good morning')
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [recentApps, setRecentApps] = useState<PopulatedApplication[]>([])
  const [interviewApps, setInterviewApps] = useState<PopulatedApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('omnify-onboarding-dismissed') === '1'
  )

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes, appsRes, interviewRes] = await Promise.all([
          applicationsAPI.getStats(),
          jobsAPI.getRecommended({ limit: 3 }),
          applicationsAPI.getAll({ limit: 4 }),
          applicationsAPI.getAll({ status: 'interview', limit: 3 }),
        ])
        setStats(statsRes.data.data)
        setRecommendedJobs(jobsRes.data.data)
        setRecentApps(appsRes.data.data as PopulatedApplication[])
        setInterviewApps(interviewRes.data.data as PopulatedApplication[])
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const hasSkills = (user?.profile?.skills?.length ?? 0) > 0
  const hasApplications = (stats?.total ?? 0) > 0
  const showOnboarding = !loading && !onboardingDismissed && !hasSkills && !hasApplications

  const dismissOnboarding = () => {
    localStorage.setItem('omnify-onboarding-dismissed', '1')
    setOnboardingDismissed(true)
  }

  const onboardingSteps = [
    { label: 'Add your skills in Settings', href: '/settings', done: hasSkills },
    { label: 'Upload and analyze your resume', href: '/resume', done: false },
    { label: 'Search and save job matches', href: '/jobs', done: false },
    { label: 'Submit your first application', href: '/applications', done: hasApplications },
  ]

  const statusData = stats ? [
    { name: 'Applied', value: stats.applied, color: '#3b82f6' },
    { name: 'Pending', value: stats.pending, color: '#8b5cf6' },
    { name: 'Interview', value: stats.interviews, color: '#64b6ac' },
    { name: 'Offer', value: stats.offers, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ].filter(s => s.value > 0) : []

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {greeting}, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats
              ? <>You have <strong className="text-slate-700">{stats.interviews} interview{stats.interviews !== 1 ? 's' : ''}</strong> scheduled and <strong className="text-slate-700">{stats.total} total applications</strong></>
              : 'Welcome to your job search dashboard'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/resume">
            <Button variant="secondary" size="sm" leftIcon={<FileText size={14} />}>
              Analyze Resume
            </Button>
          </Link>
          <Link href="/jobs">
            <Button size="sm" leftIcon={<Sparkles size={14} />}>
              Find Jobs
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Onboarding checklist — shown to new users only */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-5 border-l-4 border-brand-teal"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 mb-1">Get started with Omnify</p>
                <p className="text-xs text-slate-500 mb-4">Complete these steps to get personalized job recommendations.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {onboardingSteps.map((step, i) => (
                    <Link
                      key={i}
                      href={step.href}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-all duration-200',
                        step.done
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white hover:border-brand-teal/40 hover:bg-brand-aqua/10 text-slate-700'
                      )}
                    >
                      {step.done
                        ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                        : <Circle size={16} className="text-slate-300 flex-shrink-0" />
                      }
                      <span className={cn('text-xs', step.done && 'line-through opacity-60')}>{step.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <button
                onClick={dismissOnboarding}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI insight banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-300/20 via-brand-aqua/30 to-brand-frost p-5 border border-brand-teal/20"
      >
        <div className="absolute right-0 top-0 w-32 h-full opacity-10">
          <div className="absolute right-4 top-4 w-20 h-20 rounded-full bg-brand-teal blur-xl" />
        </div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-brand-teal" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              AI Insight: Boost your application success rate
            </p>
            <p className="text-sm text-slate-600">
              Upload your resume and let Omnify analyze it for ATS compatibility, keyword gaps, and personalized improvement suggestions.
            </p>
          </div>
          <Link href="/resume">
            <Button variant="secondary" size="sm" rightIcon={<ArrowUpRight size={14} />}>
              Analyze Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      {error ? (
        <div className="glass-card p-6 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <Skeleton className="h-10 w-10" rounded />
              <Skeleton className="h-4 w-3/4" rounded />
              <Skeleton className="h-8 w-1/2" rounded />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Applied" value={stats?.total ?? 0} icon={Briefcase}
            iconColor="text-blue-600" iconBg="bg-blue-50"
            changeLabel="All time applications"
            delay={0.1}
          />
          <StatsCard
            title="In Progress" value={(stats?.pending ?? 0) + (stats?.applied ?? 0)} icon={Target}
            iconColor="text-amber-600" iconBg="bg-amber-50"
            changeLabel="Pending & applied"
            delay={0.15}
          />
          <StatsCard
            title="Interviews" value={stats?.interviews ?? 0} icon={Calendar}
            iconColor="text-brand-teal" iconBg="bg-brand-aqua/40"
            changeLabel="Scheduled interviews"
            delay={0.2}
          />
          <StatsCard
            title="Response Rate" value={stats?.responseRate ?? 0} suffix="%" icon={TrendingUp}
            changeLabel="Based on responses received"
            iconColor="text-emerald-600" iconBg="bg-emerald-50"
            delay={0.25}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Weekly Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Applications, responses & interviews</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[
                { color: '#64b6ac', label: 'Applied' },
                { color: '#3b82f6', label: 'Responses' },
                { color: '#f59e0b', label: 'Interviews' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                  <span className="text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,182,172,0.1)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100,182,172,0.05)' }} />
              <Bar dataKey="applied" fill="#64b6ac" radius={[4, 4, 0, 0]} name="Applied" />
              <Bar dataKey="responses" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Responses" />
              <Bar dataKey="interviews" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Interviews" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Application status donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Application Status</h3>
          <p className="text-xs text-slate-400 mb-4">
            Total: {loading ? '…' : (stats?.total ?? 0)} applications
          </p>

          {!loading && statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : !loading ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <ClipboardList size={28} className="mb-2 opacity-40" />
              <p className="text-xs">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-32 w-32 mx-auto" circle />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" rounded />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recommended jobs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">AI Job Recommendations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Matched to your skills & experience</p>
            </div>
            <Link href="/jobs">
              <Button variant="ghost" size="xs" rightIcon={<ChevronRight size={12} />}>
                View all
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5">
                  <Skeleton className="w-11 h-11 flex-shrink-0" rounded />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" rounded />
                    <Skeleton className="h-3 w-1/2" rounded />
                    <Skeleton className="h-3 w-1/3" rounded />
                  </div>
                  <Skeleton className="h-6 w-20" rounded />
                </div>
              ))
            ) : recommendedJobs.length > 0 ? (
              recommendedJobs.map((job) => {
                const companyName = job.company?.name || 'Unknown'
                const logoColor = getLogoColor(companyName)
                const salary = job.salary
                  ? formatSalary(job.salary.min, job.salary.max, job.salary.currency, job.salary.period)
                  : null
                return (
                  <motion.div
                    key={job._id}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm`}>
                      {companyName[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 size={10} /> {companyName}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {job.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {salary && <span className="text-xs font-medium text-slate-600">{salary}</span>}
                        <Badge variant={job.remote === 'remote' ? 'teal' : 'info'} className="text-[10px]">
                          {job.remote}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {job.matchScore != null && (
                        <div className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-lg',
                          job.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {job.matchScore}% match
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-teal"
                      >
                        Apply
                      </Button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Briefcase size={28} className="mb-2 opacity-40" />
                <p className="text-xs">No recommendations yet — update your profile skills</p>
              </div>
            )}
          </div>

          <Link
            href="/jobs"
            className="mt-4 block text-center text-xs font-medium text-brand-teal hover:underline py-2"
          >
            Browse all jobs →
          </Link>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming interviews */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Upcoming Interviews</h3>
              <Calendar size={14} className="text-slate-400" />
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="w-9 h-9 flex-shrink-0" rounded />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" rounded />
                      <Skeleton className="h-3 w-1/2" rounded />
                    </div>
                  </div>
                ))}
              </div>
            ) : interviewApps.length > 0 ? (
              interviewApps.map((app, i) => {
                const job = app.jobId as Job | null
                const companyName = job?.company?.name || 'Unknown'
                const logoColor = getLogoColor(companyName)
                const interview = app.interviews?.[0]
                return (
                  <div key={app._id} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-slate-100')}>
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {companyName[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{job?.title || 'Interview'}</p>
                      <p className="text-xs text-slate-500">{companyName} · {interview?.type || 'Interview'}</p>
                      <p className="text-xs text-brand-teal font-medium mt-0.5">
                        {interview?.scheduledAt ? formatDateTime(interview.scheduledAt) : 'Date TBD'}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <Calendar size={24} className="mb-1.5 opacity-40" />
                <p className="text-xs">No interviews scheduled</p>
              </div>
            )}
            <Link href="/applications" className="block mt-2">
              <Button variant="outline" size="xs" fullWidth rightIcon={<ChevronRight size={12} />}>
                View applications
              </Button>
            </Link>
          </motion.div>

          {/* Recent applications */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Recent Applications</h3>
              <Link href="/applications">
                <button className="text-xs text-brand-teal hover:underline cursor-pointer">View all</button>
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" rounded />
                      <Skeleton className="h-3 w-1/2" rounded />
                    </div>
                    <Skeleton className="h-5 w-16 flex-shrink-0" rounded />
                  </div>
                ))}
              </div>
            ) : recentApps.length > 0 ? (
              <div className="space-y-2.5">
                {recentApps.map((app) => {
                  const sc = getStatusConfig(app.status)
                  const job = app.jobId as Job | null
                  const title = job?.title || 'Unknown Role'
                  const company = job?.company?.name || 'Unknown'
                  return (
                    <div key={app._id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{title}</p>
                        <p className="text-xs text-slate-500">{company}</p>
                      </div>
                      <span className={cn('badge text-[10px] flex-shrink-0', sc.bg, sc.color)}>
                        {sc.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <ClipboardList size={24} className="mb-1.5 opacity-40" />
                <p className="text-xs">No applications yet</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
