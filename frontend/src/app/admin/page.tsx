'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users, Briefcase, ClipboardList, TrendingUp, Activity, Shield,
  Database, Cpu, CheckCircle, AlertCircle, XCircle, ChevronRight,
  Search, Download, RefreshCw, Sparkles, ArrowLeft
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn, timeAgo, formatNumber } from '@/lib/utils'

const adminStats = [
  { label: 'Total Users', value: 52847, change: 12.4, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Today', value: 8234, change: 5.2, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Applications', value: 284910, change: 18.7, icon: ClipboardList, color: 'text-brand-teal', bg: 'bg-brand-aqua/30' },
  { label: 'Jobs Posted', value: 15432, change: 9.1, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const growthData = [
  { month: 'Jul', users: 24000, apps: 120000 },
  { month: 'Aug', users: 28000, apps: 145000 },
  { month: 'Sep', users: 33000, apps: 178000 },
  { month: 'Oct', users: 38000, apps: 215000 },
  { month: 'Nov', users: 45000, apps: 248000 },
  { month: 'Dec', users: 52847, apps: 284910 },
]

const recentUsers = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', plan: 'pro', joined: '2024-12-11T09:00:00Z', apps: 12, status: 'active' },
  { id: '2', name: 'Michael Chen', email: 'm.chen@email.com', plan: 'free', joined: '2024-12-11T08:30:00Z', apps: 4, status: 'active' },
  { id: '3', name: 'Emma Davis', email: 'emma.d@email.com', plan: 'enterprise', joined: '2024-12-10T16:00:00Z', apps: 89, status: 'active' },
  { id: '4', name: 'James Wilson', email: 'j.wilson@email.com', plan: 'free', joined: '2024-12-10T12:00:00Z', apps: 2, status: 'inactive' },
  { id: '5', name: 'Lisa Thompson', email: 'l.thompson@email.com', plan: 'pro', joined: '2024-12-09T10:00:00Z', apps: 28, status: 'active' },
]

const systemServices = [
  { name: 'REST API', status: 'healthy', uptime: '99.9%', latency: '42ms' },
  { name: 'AI Service', status: 'healthy', uptime: '99.8%', latency: '230ms' },
  { name: 'MongoDB', status: 'healthy', uptime: '100%', latency: '8ms' },
  { name: 'Automation Engine', status: 'degraded', uptime: '98.1%', latency: '1200ms' },
  { name: 'File Storage', status: 'healthy', uptime: '99.9%', latency: '95ms' },
  { name: 'Email Service', status: 'healthy', uptime: '99.7%', latency: '180ms' },
]

const topSkills = [
  { skill: 'React', count: 12847, trend: 'up' },
  { skill: 'TypeScript', count: 11234, trend: 'up' },
  { skill: 'Python', count: 10892, trend: 'up' },
  { skill: 'Node.js', count: 9456, trend: 'stable' },
  { skill: 'AWS', count: 8934, trend: 'up' },
]

const statusIcon = { healthy: CheckCircle, degraded: AlertCircle, down: XCircle }
const statusColor = { healthy: 'text-emerald-600', degraded: 'text-amber-600', down: 'text-red-600' }
const statusBg = { healthy: 'bg-emerald-50', degraded: 'bg-amber-50', down: 'bg-red-50' }

export default function AdminPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-dvh bg-mesh bg-brand-white">
      {/* Admin header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-glass border-b border-slate-100/80 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft size={15} /> Back to App
          </Link>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">Admin Panel</span>
            <Badge variant="teal" className="text-[10px]">Super Admin</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={13} />}>Refresh</Button>
          <Button size="sm" leftIcon={<Download size={13} />}>Export Data</Button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {adminStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.bg)}>
                  <s.icon size={16} className={s.color} />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  +{s.change}%
                </span>
              </div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{formatNumber(s.value)}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* User growth */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Platform Growth</h3>
                <p className="text-xs text-slate-400">Users & applications over time</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-brand-teal" /><span className="text-slate-500">Users</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span className="text-slate-500">Applications</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64b6ac" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#64b6ac" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,182,172,0.1)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v)} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} formatter={v => [formatNumber(v as number)]} />
                <Area type="monotone" dataKey="users" stroke="#64b6ac" fill="url(#colorUsers)" strokeWidth={2} name="Users" />
                <Area type="monotone" dataKey="apps" stroke="#3b82f6" fill="url(#colorApps)" strokeWidth={2} name="Applications" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top skills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Skills in Demand</h3>
            <div className="space-y-3">
              {topSkills.map((s, i) => (
                <div key={s.skill}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{s.skill}</span>
                    <span className="text-slate-500">{formatNumber(s.count)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / topSkills[0].count) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-brand-teal to-primary-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* System health + Recent users */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* System health */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">System Health</h3>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                All systems operational
              </div>
            </div>
            <div className="space-y-2.5">
              {systemServices.map(svc => {
                const StatusIcon = statusIcon[svc.status as keyof typeof statusIcon]
                return (
                  <div key={svc.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', statusBg[svc.status as keyof typeof statusBg])}>
                      <StatusIcon size={14} className={statusColor[svc.status as keyof typeof statusColor]} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-700">{svc.name}</p>
                      <p className="text-xs text-slate-400">Latency: {svc.latency}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={svc.status === 'healthy' ? 'success' : svc.status === 'degraded' ? 'warning' : 'error'}>
                        {svc.status}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-0.5">{svc.uptime} uptime</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Recent users */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Recent Users</h3>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-brand-teal/20 bg-white/80 text-xs text-slate-800 focus:outline-none focus:border-brand-teal/60 transition-all w-36"
                />
              </div>
            </div>

            <div className="space-y-2">
              {recentUsers.filter(u =>
                !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
              ).map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors group cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.plan === 'enterprise' ? 'purple' : u.plan === 'pro' ? 'teal' : 'slate'} className="text-[10px]">
                      {u.plan}
                    </Badge>
                    <span className="text-xs text-slate-400">{u.apps} apps</span>
                    <ChevronRight size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-3 w-full text-xs text-center text-brand-teal hover:underline py-2 cursor-pointer">
              View all {formatNumber(52847)} users →
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
