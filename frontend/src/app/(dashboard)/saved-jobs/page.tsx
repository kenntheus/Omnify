'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bookmark, Search, MapPin, DollarSign, Clock,
  Building2, BookmarkX, Zap, Sparkles, ExternalLink, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatSalary, timeAgo } from '@/lib/utils'
import { jobsAPI, applicationsAPI } from '@/lib/api'
import type { Job } from '@/types'
import toast from 'react-hot-toast'

interface SavedJobEntry {
  job: Job
  savedAt: string
}

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

export default function SavedJobsPage() {
  const [entries, setEntries] = useState<SavedJobEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await jobsAPI.getSaved()
        setEntries(res.data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const remove = async (jobId: string) => {
    setRemovingIds(prev => new Set(prev).add(jobId))
    // Optimistic remove
    setEntries(prev => prev.filter(e => e.job._id !== jobId))
    try {
      await jobsAPI.unsaveJob(jobId)
      toast.success('Removed from saved jobs')
    } catch {
      // Revert — refetch to restore
      try {
        const res = await jobsAPI.getSaved()
        setEntries(res.data.data)
      } catch {
        // ignore
      }
      toast.error('Failed to remove saved job')
    } finally {
      setRemovingIds(prev => { const next = new Set(prev); next.delete(jobId); return next })
    }
  }

  const applyJob = async (jobId: string) => {
    setApplyingIds(prev => new Set(prev).add(jobId))
    try {
      await applicationsAPI.autoApply(jobId, undefined as unknown as string, {})
      toast.success('Application submitted!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to apply')
    } finally {
      setApplyingIds(prev => { const next = new Set(prev); next.delete(jobId); return next })
    }
  }

  const filtered = entries.filter(({ job }) => {
    if (!search) return true
    const q = search.toLowerCase()
    const company = getCompanyName(job.company).toLowerCase()
    return job.title.toLowerCase().includes(q) || company.includes(q)
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Saved Jobs</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${entries.length} job${entries.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        <Link href="/jobs">
          <Button leftIcon={<Sparkles size={15} />}>Find More Jobs</Button>
        </Link>
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

      {/* Error */}
      {error && (
        <div className="glass-card p-5 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">Failed to load saved jobs. Please try refreshing.</span>
        </div>
      )}

      {/* Job grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 flex-shrink-0" rounded />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" rounded />
                  <Skeleton className="h-3 w-1/2" rounded />
                </div>
              </div>
              <Skeleton className="h-3 w-full" rounded />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16" rounded />
                <Skeleton className="h-5 w-20" rounded />
                <Skeleton className="h-5 w-14" rounded />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1" rounded />
                <Skeleton className="h-8 w-20" rounded />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(({ job, savedAt }, i) => {
              const companyName = getCompanyName(job.company)
              const logoColor = getLogoColor(companyName)

              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i * 0.06, 0.3) }}
                  layout
                  className="glass-card p-5 flex flex-col gap-4 group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                        {companyName[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{job.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={10} /> {companyName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(job._id)}
                      disabled={removingIds.has(job._id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-30"
                      aria-label="Remove saved job"
                    >
                      <BookmarkX size={15} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={10} />
                        {formatSalary(job.salary.min, job.salary.max, job.salary.currency, job.salary.period)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={10} />Saved {timeAgo(savedAt)}
                    </span>
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
                    {job.matchScore != null ? (
                      <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-brand-teal" />
                        <span className="text-xs font-semibold text-slate-600">
                          <span className={cn(
                            job.matchScore >= 90 ? 'text-emerald-600' :
                            job.matchScore >= 80 ? 'text-blue-600' : 'text-amber-600'
                          )}>
                            {job.matchScore}%
                          </span> match
                        </span>
                      </div>
                    ) : <span />}
                    {job.deadline && (
                      <span className="text-xs text-red-500 font-medium">
                        Deadline: {timeAgo(job.deadline)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" fullWidth leftIcon={<Zap size={13} />} loading={applyingIds.has(job._id)} onClick={() => applyJob(job._id)}>Apply Now</Button>
                    {job.sourceUrl && (
                      <a href={job.sourceUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="secondary" leftIcon={<ExternalLink size={13} />}>View</Button>
                      </a>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}

      {!loading && filtered.length === 0 && (
        <div className="glass-card py-16 text-center">
          <Bookmark size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {entries.length === 0 ? 'No saved jobs yet' : 'No jobs match your search'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {entries.length === 0 ? 'Browse jobs and bookmark ones you like' : 'Try a different search term'}
          </p>
          {entries.length === 0 && (
            <Link href="/jobs">
              <Button className="mt-4" size="sm" leftIcon={<Sparkles size={14} />}>Browse Jobs</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
