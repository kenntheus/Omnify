'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Search, MapPin, DollarSign, Briefcase, Clock, Building2, BookmarkX, Zap, Sparkles, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn, formatSalary, timeAgo } from '@/lib/utils'

const savedJobs = [
  { id: '1', title: 'React Developer', company: 'Vercel', logo: '▲', logoColor: 'from-slate-700 to-slate-900', location: 'Remote', remote: 'remote', salary: { min: 140000, max: 175000, currency: 'USD', period: 'yearly' }, type: 'full-time', skills: ['React', 'Next.js', 'TypeScript'], matchScore: 92, savedAt: '2024-12-11T10:00:00Z', deadline: null },
  { id: '2', title: 'Frontend Engineer', company: 'Figma', logo: 'F', logoColor: 'from-pink-500 to-rose-600', location: 'Remote', remote: 'remote', salary: { min: 150000, max: 190000, currency: 'USD', period: 'yearly' }, type: 'full-time', skills: ['React', 'WebGL', 'TypeScript'], matchScore: 80, savedAt: '2024-12-09T09:00:00Z', deadline: '2024-12-20T00:00:00Z' },
  { id: '3', title: 'Senior Engineer', company: 'Loom', logo: 'L', logoColor: 'from-purple-500 to-indigo-600', location: 'San Francisco, CA', remote: 'hybrid', salary: { min: 160000, max: 200000, currency: 'USD', period: 'yearly' }, type: 'full-time', skills: ['React', 'Node.js', 'AWS'], matchScore: 85, savedAt: '2024-12-08T14:00:00Z', deadline: null },
  { id: '4', title: 'Staff Engineer', company: 'Coda', logo: 'C', logoColor: 'from-cyan-500 to-blue-600', location: 'San Francisco, CA', remote: 'hybrid', salary: { min: 200000, max: 240000, currency: 'USD', period: 'yearly' }, type: 'full-time', skills: ['React', 'TypeScript', 'Databases'], matchScore: 76, savedAt: '2024-12-07T11:00:00Z', deadline: '2024-12-18T00:00:00Z' },
]

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState(savedJobs)
  const [search, setSearch] = useState('')

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
  )

  const remove = (id: string) => setJobs(prev => prev.filter(j => j.id !== id))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Saved Jobs</h1>
          <p className="page-subtitle">{jobs.length} jobs saved — apply before deadlines</p>
        </div>
        <Button leftIcon={<Sparkles size={15} />}>Find More Jobs</Button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saved jobs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
          />
        </div>
      </div>

      {/* Job grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-5 flex flex-col gap-4 group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${job.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                  {job.logo}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{job.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 size={10} /> {job.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => remove(job.id)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Remove saved job"
              >
                <BookmarkX size={15} />
              </button>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
              <span className="flex items-center gap-1"><DollarSign size={10} />{formatSalary(job.salary.min, job.salary.max)}</span>
              <span className="flex items-center gap-1"><Clock size={10} />Saved {timeAgo(job.savedAt)}</span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={job.remote === 'remote' ? 'teal' : 'info'}>{job.remote}</Badge>
              {job.skills.slice(0, 3).map(s => (
                <Badge key={s} variant="default" className="text-[10px]">{s}</Badge>
              ))}
            </div>

            {/* Match score */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-brand-teal" />
                <span className="text-xs font-semibold text-slate-600">
                  <span className={job.matchScore >= 90 ? 'text-emerald-600' : job.matchScore >= 80 ? 'text-blue-600' : 'text-amber-600'}>
                    {job.matchScore}%
                  </span> match
                </span>
              </div>
              {job.deadline && (
                <span className="text-xs text-red-500 font-medium">
                  Deadline: Dec 20
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" fullWidth leftIcon={<Zap size={13} />}>Apply Now</Button>
              <Button size="sm" variant="secondary" leftIcon={<ExternalLink size={13} />}>View</Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card py-16 text-center">
          <Bookmark size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No saved jobs</p>
          <p className="text-xs text-slate-400 mt-1">Browse jobs and save ones you like</p>
          <Button className="mt-4" size="sm" leftIcon={<Sparkles size={14} />}>Browse Jobs</Button>
        </div>
      )}
    </div>
  )
}
