'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Briefcase, FileText, ClipboardList, TrendingUp, Sparkles,
  ChevronRight, Calendar, Building2, MapPin, Star, Zap,
  Trophy, Target, ArrowUpRight, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import StatsCard from '@/components/dashboard/StatsCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn, getStatusConfig, timeAgo } from '@/lib/utils'

// ── Mock data ──────────────────────────────────────────────────
const weeklyData = [
  { day: 'Mon', applied: 3, responses: 1, interviews: 0 },
  { day: 'Tue', applied: 5, responses: 2, interviews: 1 },
  { day: 'Wed', applied: 2, responses: 1, interviews: 0 },
  { day: 'Thu', applied: 7, responses: 3, interviews: 1 },
  { day: 'Fri', applied: 4, responses: 2, interviews: 2 },
  { day: 'Sat', applied: 1, responses: 0, interviews: 0 },
  { day: 'Sun', applied: 0, responses: 1, interviews: 1 },
]

const statusData = [
  { name: 'Applied', value: 24, color: '#3b82f6' },
  { name: 'Reviewing', value: 8, color: '#8b5cf6' },
  { name: 'Interview', value: 5, color: '#64b6ac' },
  { name: 'Offer', value: 2, color: '#10b981' },
  { name: 'Rejected', value: 11, color: '#ef4444' },
]

const recommendedJobs = [
  {
    id: '1', title: 'Senior Frontend Engineer', company: 'Stripe',
    location: 'San Francisco, CA', remote: 'hybrid',
    salary: '$160K–$200K', matchScore: 96,
    logo: 'S', logoColor: 'from-violet-500 to-purple-600', postedAt: '2024-12-10T08:00:00Z',
  },
  {
    id: '2', title: 'React Developer', company: 'Vercel',
    location: 'Remote', remote: 'remote',
    salary: '$140K–$175K', matchScore: 92,
    logo: '▲', logoColor: 'from-slate-700 to-slate-900', postedAt: '2024-12-11T10:00:00Z',
  },
  {
    id: '3', title: 'Full Stack Engineer', company: 'Linear',
    location: 'New York, NY', remote: 'hybrid',
    salary: '$130K–$165K', matchScore: 88,
    logo: 'L', logoColor: 'from-indigo-500 to-blue-600', postedAt: '2024-12-09T14:00:00Z',
  },
]

const recentApplications = [
  { id: '1', company: 'Notion', title: 'Frontend Engineer', status: 'interview', date: '2024-12-08T09:00:00Z' },
  { id: '2', company: 'Figma', title: 'React Developer', status: 'reviewing', date: '2024-12-07T14:00:00Z' },
  { id: '3', company: 'GitHub', title: 'Senior Engineer', status: 'applied', date: '2024-12-06T11:00:00Z' },
  { id: '4', company: 'OpenAI', title: 'Full Stack Dev', status: 'rejected', date: '2024-12-05T16:00:00Z' },
]

const upcomingInterviews = [
  { company: 'Notion', role: 'Frontend Engineer', type: 'Technical', date: 'Dec 15 • 2:00 PM', logo: 'N', logoColor: 'from-slate-700 to-slate-900' },
  { company: 'Stripe', role: 'Senior Developer', type: 'Culture Fit', date: 'Dec 17 • 10:30 AM', logo: 'S', logoColor: 'from-violet-500 to-purple-600' },
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
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

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
            {greeting}, <span className="gradient-text">Alex</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            You have <strong className="text-slate-700">3 interviews</strong> this week and{' '}
            <strong className="text-slate-700">12 new job matches</strong>
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
              🎯 AI Insight: Your resume is 87% ATS-compatible
            </p>
            <p className="text-sm text-slate-600">
              Adding keywords like <strong>&ldquo;TypeScript&rdquo;</strong>, <strong>&ldquo;GraphQL&rdquo;</strong>, and <strong>&ldquo;system design&rdquo;</strong> could boost your match scores by up to <strong>23%</strong>
            </p>
          </div>
          <Link href="/resume">
            <Button variant="secondary" size="sm" rightIcon={<ArrowUpRight size={14} />}>
              Improve Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Applied" value={50} icon={Briefcase}
          change={12} changeLabel="vs last week"
          iconColor="text-blue-600" iconBg="bg-blue-50"
          delay={0.1}
        />
        <StatsCard
          title="In Progress" value={13} icon={Target}
          iconColor="text-amber-600" iconBg="bg-amber-50"
          changeLabel="Active applications"
          delay={0.15}
        />
        <StatsCard
          title="Interviews" value={5} icon={Calendar}
          change={25} changeLabel="This month"
          iconColor="text-brand-teal" iconBg="bg-brand-aqua/40"
          delay={0.2}
        />
        <StatsCard
          title="Response Rate" value={32} suffix="%" icon={TrendingUp}
          change={8} changeLabel="Industry avg: 20%"
          iconColor="text-emerald-600" iconBg="bg-emerald-50"
          delay={0.25}
        />
      </div>

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
          <p className="text-xs text-slate-400 mb-4">Total: 50 applications</p>

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
            {recommendedJobs.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${job.logoColor} flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm`}>
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 size={10} /> {job.company}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} /> {job.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-medium text-slate-600">{job.salary}</span>
                    <Badge variant={job.remote === 'remote' ? 'teal' : 'info'} className="text-[10px]">
                      {job.remote}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={cn(
                    'text-xs font-bold px-2.5 py-1 rounded-lg',
                    job.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  )}>
                    {job.matchScore}% match
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-teal"
                  >
                    Apply
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            href="/jobs"
            className="mt-4 block text-center text-xs font-medium text-brand-teal hover:underline py-2"
          >
            View 47 more matching jobs →
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
            {upcomingInterviews.map((interview, i) => (
              <div key={i} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-slate-100')}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${interview.logoColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {interview.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{interview.role}</p>
                  <p className="text-xs text-slate-500">{interview.company} · {interview.type}</p>
                  <p className="text-xs text-brand-teal font-medium mt-0.5">{interview.date}</p>
                </div>
              </div>
            ))}
            <Link href="/applications" className="block mt-2">
              <Button variant="outline" size="xs" fullWidth rightIcon={<ChevronRight size={12} />}>
                View calendar
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
            <div className="space-y-2.5">
              {recentApplications.map((app) => {
                const sc = getStatusConfig(app.status)
                return (
                  <div key={app.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{app.title}</p>
                      <p className="text-xs text-slate-500">{app.company}</p>
                    </div>
                    <span className={cn('badge text-[10px] flex-shrink-0', sc.bg, sc.color)}>
                      {sc.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
