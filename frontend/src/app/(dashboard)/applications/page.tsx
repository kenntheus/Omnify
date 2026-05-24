'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Search, Filter, Calendar, MapPin, Building2,
  Plus, ChevronRight, Clock, CheckCircle, XCircle, TrendingUp,
  BarChart2, ArrowUpRight, Eye, MessageSquare, Star, Zap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn, getStatusConfig, formatDate, timeAgo } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

// ── Mock Data ─────────────────────────────────────────────────
const stats = [
  { label: 'Total Applied', value: 50, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'In Review', value: 13, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Interviews', value: 5, icon: Calendar, color: 'text-brand-teal', bg: 'bg-brand-aqua/30' },
  { label: 'Offers', value: 2, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Response Rate', value: '32%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
]

const applications = [
  {
    id: '1', title: 'Senior Frontend Engineer', company: 'Stripe', logo: 'S', logoColor: 'from-violet-500 to-purple-600',
    location: 'San Francisco, CA', remote: 'hybrid', salary: '$160K–$200K',
    status: 'interview' as ApplicationStatus, appliedAt: '2024-12-01T08:00:00Z', updatedAt: '2024-12-08T14:00:00Z',
    nextStep: 'Technical interview on Dec 15 at 2:00 PM', automated: true,
  },
  {
    id: '2', title: 'React Developer', company: 'Vercel', logo: '▲', logoColor: 'from-slate-700 to-slate-900',
    location: 'Remote', remote: 'remote', salary: '$140K–$175K',
    status: 'reviewing' as ApplicationStatus, appliedAt: '2024-12-03T10:00:00Z', updatedAt: '2024-12-07T09:00:00Z',
    nextStep: 'Recruiter is reviewing your profile', automated: true,
  },
  {
    id: '3', title: 'Full Stack Engineer', company: 'Linear', logo: 'L', logoColor: 'from-indigo-500 to-blue-600',
    location: 'New York, NY', remote: 'hybrid', salary: '$130K–$165K',
    status: 'applied' as ApplicationStatus, appliedAt: '2024-12-05T14:00:00Z', updatedAt: '2024-12-05T14:00:00Z',
    nextStep: null, automated: false,
  },
  {
    id: '4', title: 'Frontend Engineer', company: 'Figma', logo: 'F', logoColor: 'from-pink-500 to-rose-600',
    location: 'Remote', remote: 'remote', salary: '$150K–$190K',
    status: 'offer' as ApplicationStatus, appliedAt: '2024-11-25T09:00:00Z', updatedAt: '2024-12-10T11:00:00Z',
    nextStep: 'Offer: $175K base + equity. Deadline Dec 20', automated: false,
  },
  {
    id: '5', title: 'Software Engineer', company: 'GitHub', logo: 'G', logoColor: 'from-gray-700 to-gray-900',
    location: 'Remote', remote: 'remote', salary: '$130K–$170K',
    status: 'rejected' as ApplicationStatus, appliedAt: '2024-11-20T11:00:00Z', updatedAt: '2024-12-01T16:00:00Z',
    nextStep: null, automated: true,
  },
  {
    id: '6', title: 'Staff Engineer', company: 'Notion', logo: 'N', logoColor: 'from-slate-600 to-slate-800',
    location: 'San Francisco, CA', remote: 'hybrid', salary: '$200K–$250K',
    status: 'phone_screen' as ApplicationStatus, appliedAt: '2024-12-02T08:00:00Z', updatedAt: '2024-12-09T10:00:00Z',
    nextStep: 'Phone screen scheduled for Dec 13', automated: false,
  },
]

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
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(applications[0])

  const filtered = applications.filter(a => {
    const matchesTab = activeTab === 'all' || a.status === activeTab
    const matchesSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.company.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Applications Tracker</h1>
          <p className="page-subtitle">Track and manage all your job applications in one place</p>
        </div>
        <Button leftIcon={<Plus size={15} />}>Add Application</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s, i) => (
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
          <div className="space-y-2.5">
            {[
              { label: 'Applied', count: 24, pct: 48, color: 'bg-blue-400' },
              { label: 'Reviewing', count: 8, pct: 16, color: 'bg-purple-400' },
              { label: 'Interview', count: 5, pct: 10, color: 'bg-brand-teal' },
              { label: 'Offer', count: 2, pct: 4, color: 'bg-amber-400' },
              { label: 'Rejected', count: 11, pct: 22, color: 'bg-red-400' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-slate-400">{row.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', row.color)}
                  />
                </div>
              </div>
            ))}
          </div>
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
                  <span className="ml-1.5 opacity-60">
                    {tab.value === 'all' ? applications.length : applications.filter(a => a.status === tab.value).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[1fr_120px_120px_120px_40px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500">Position</span>
          <span className="text-xs font-semibold text-slate-500">Status</span>
          <span className="text-xs font-semibold text-slate-500">Applied</span>
          <span className="text-xs font-semibold text-slate-500">Updated</span>
          <span></span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No applications found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filtered.map((app, i) => {
              const sc = getStatusConfig(app.status)
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(app)}
                  className="flex flex-col lg:grid lg:grid-cols-[1fr_120px_120px_120px_40px] gap-3 lg:gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Position */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {app.logo}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{app.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Building2 size={10} />{app.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{app.location}</span>
                        {app.automated && (
                          <span className="flex items-center gap-1 text-brand-teal"><Zap size={10} />Auto</span>
                        )}
                      </div>
                      {app.nextStep && (
                        <p className="text-xs text-brand-teal mt-0.5 truncate">→ {app.nextStep}</p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <span className={cn('badge text-xs', sc.bg, sc.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', sc.dot)} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Applied */}
                  <div className="flex items-center">
                    <span className="text-xs text-slate-500">{formatDate(app.appliedAt)}</span>
                  </div>

                  {/* Updated */}
                  <div className="flex items-center">
                    <span className="text-xs text-slate-400">{timeAgo(app.updatedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="hidden lg:flex items-center justify-end">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
