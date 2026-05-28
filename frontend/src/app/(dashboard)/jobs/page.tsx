'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Briefcase, Building2, Clock, DollarSign,
  Bookmark, BookmarkCheck, Sparkles, SlidersHorizontal, Star, Zap,
  ExternalLink, Users, AlertCircle, Loader2
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SkeletonJobCard } from '@/components/ui/Skeleton'
import { cn, formatSalary, timeAgo } from '@/lib/utils'
import { jobsAPI, applicationsAPI } from '@/lib/api'
import type { Job } from '@/types'
import toast from 'react-hot-toast'

type SortOption = 'match' | 'recent' | 'salary'

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set())
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('match')
  const [remoteFilter, setRemoteFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const isFirstRun = useRef(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchJobs = useCallback(async (params: Record<string, string>) => {
    setError(false)
    try {
      const res = await jobsAPI.search({ limit: 20, ...params })
      const fetched: Job[] = res.data.data
      setJobs(fetched)
      // Derive saved job IDs from applicationStatus returned by the search endpoint
      const saved = new Set(
        fetched
          .filter((j) => (j as Job & { applicationStatus?: string }).applicationStatus === 'saved')
          .map((j) => j._id)
      )
      setSavedJobIds(saved)
      setSelectedJob(prev => prev ? (fetched.find(j => j._id === prev._id) ?? fetched[0] ?? null) : (fetched[0] ?? null))
    } catch {
      setError(true)
    }
  }, [])

  // Initial load
  useEffect(() => {
    const init = async () => {
      await fetchJobs({})
      setLoading(false)
    }
    init()
  }, [fetchJobs])

  // Debounced search on filter changes (skip first run — handled by init)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const isText = query !== '' || location !== ''
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      const params: Record<string, string> = {}
      if (query) params.query = query
      if (location) params.location = location
      if (remoteFilter) params.remote = remoteFilter
      if (typeFilter) params.type = typeFilter
      await fetchJobs(params)
      setSearching(false)
    }, isText ? 500 : 0)

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query, location, remoteFilter, typeFilter, fetchJobs])

  const toggleSave = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation()
    if (savingIds.has(job._id)) return

    const wasSaved = savedJobIds.has(job._id)
    setSavedJobIds(prev => {
      const next = new Set(prev)
      wasSaved ? next.delete(job._id) : next.add(job._id)
      return next
    })
    setSavingIds(prev => new Set(prev).add(job._id))

    try {
      if (wasSaved) {
        await jobsAPI.unsaveJob(job._id)
        toast.success('Removed from saved jobs')
      } else {
        await jobsAPI.saveJob(job._id)
        toast.success('Job saved')
      }
    } catch {
      // Revert optimistic update
      setSavedJobIds(prev => {
        const next = new Set(prev)
        wasSaved ? next.add(job._id) : next.delete(job._id)
        return next
      })
      toast.error(wasSaved ? 'Failed to unsave' : 'Failed to save job')
    } finally {
      setSavingIds(prev => { const next = new Set(prev); next.delete(job._id); return next })
    }
  }

  const handleAutoApply = async (job: Job) => {
    if (!job.sourceUrl) {
      toast.error('No external application URL available for this job')
      return
    }
    setApplyingIds(prev => new Set(prev).add(job._id))
    try {
      const res = await applicationsAPI.autoApply(job._id, '', {})
      const automation = (res.data as { data?: { automation?: { success?: boolean } } }).data?.automation
      if (automation?.success) {
        toast.success('Application submitted via auto-apply!')
      } else {
        toast.success('Application recorded — automation service unavailable')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Auto-apply failed. Please try applying manually.')
    } finally {
      setApplyingIds(prev => { const next = new Set(prev); next.delete(job._id); return next })
    }
  }

  const displayJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') return (b.matchScore ?? 0) - (a.matchScore ?? 0)
    if (sortBy === 'recent') return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    if (sortBy === 'salary') return (b.salary?.max ?? 0) - (a.salary?.max ?? 0)
    return 0
  })

  return (
    <div className="space-y-5 h-full">
      <div className="page-header">
        <h1 className="page-title">Job Search</h1>
        <p className="page-subtitle">AI-matched opportunities based on your skills and experience</p>
      </div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            {searching && (
              <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-teal animate-spin" />
            )}
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search jobs, companies, skills..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 focus:bg-white transition-all"
            />
          </div>
          <div className="relative sm:w-48">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 focus:bg-white transition-all"
            />
          </div>
          <Button
            variant="secondary"
            leftIcon={<SlidersHorizontal size={15} />}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            Filters
            {(remoteFilter || typeFilter) && (
              <span className="w-4 h-4 bg-brand-teal rounded-full text-white text-[9px] flex items-center justify-center ml-1">
                {[remoteFilter, typeFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
          <Button leftIcon={<Sparkles size={15} />}>
            AI Search
          </Button>
        </div>

        {/* Filter chips */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">Remote</p>
                  <div className="flex gap-2">
                    {['', 'remote', 'hybrid', 'onsite'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRemoteFilter(r)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                          remoteFilter === r ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {r || 'Any'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">Job Type</p>
                  <div className="flex gap-2">
                    {['', 'full-time', 'part-time', 'contract'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                          typeFilter === t ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {t || 'Any'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ml-auto">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Sort by</p>
                  <div className="flex gap-2">
                    {([['match', 'Best Match'], ['recent', 'Newest'], ['salary', 'Salary']] as [SortOption, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setSortBy(val)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                          sortBy === val ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-5 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">Failed to load jobs. Check your connection and try again.</span>
        </div>
      )}

      {/* Results */}
      <div className="flex gap-5 h-[calc(100dvh-280px)] min-h-[500px]">
        {/* Job list */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 overflow-y-auto space-y-3 scroll-hide pb-4">
          <div className="flex items-center justify-between mb-1 px-0.5">
            <p className="text-sm text-slate-500">
              {loading ? (
                <span className="text-slate-400">Loading…</span>
              ) : (
                <><strong className="text-slate-800">{displayJobs.length}</strong> jobs found</>
              )}
            </p>
            <p className="text-xs text-brand-teal font-medium flex items-center gap-1">
              <Sparkles size={11} /> AI-ranked by match
            </p>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonJobCard key={i} />)
          ) : displayJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 glass-card">
              <Briefcase size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No jobs found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            displayJobs.map((job, i) => {
              const companyName = getCompanyName(job.company)
              const logoColor = getLogoColor(companyName)
              const saved = savedJobIds.has(job._id)
              const active = selectedJob?._id === job._id

              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3 }}
                  onClick={() => setSelectedJob(job)}
                  className={cn(
                    'p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative',
                    active
                      ? 'bg-white border-brand-teal/40 shadow-card-hover ring-1 ring-brand-teal/20'
                      : 'glass-card hover:shadow-card-hover hover:border-brand-teal/20'
                  )}
                >
                  {/* Match badge + save */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {job.matchScore != null && (
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        job.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700' :
                        job.matchScore >= 80 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      )}>
                        {job.matchScore}%
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleSave(job, e)}
                      disabled={savingIds.has(job._id)}
                      className={cn(
                        'p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50',
                        saved ? 'text-brand-teal hover:text-slate-400' : 'text-slate-300 hover:text-brand-teal'
                      )}
                      aria-label={saved ? 'Unsave job' : 'Save job'}
                    >
                      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  <div className="flex items-start gap-3 pr-16">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                      {companyName[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 leading-tight">{job.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{companyName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={11} />
                        {formatSalary(job.salary.min, job.salary.max, job.salary.currency, job.salary.period)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <Badge variant={job.remote === 'remote' ? 'teal' : job.remote === 'hybrid' ? 'info' : 'slate'}>
                      {job.remote}
                    </Badge>
                    {job.skills.slice(0, 3).map(s => (
                      <Badge key={s} variant="default" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Job detail panel */}
        <AnimatePresence mode="wait">
          {selectedJob && (
            <motion.div
              key={selectedJob._id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="hidden lg:flex flex-col flex-1 glass-card overflow-hidden"
            >
              {/* Job header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const companyName = getCompanyName(selectedJob.company)
                      return (
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getLogoColor(companyName)} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md`}>
                          {companyName[0]?.toUpperCase() || '?'}
                        </div>
                      )
                    })()}
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedJob.title}</h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 size={13} />{getCompanyName(selectedJob.company)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />{selectedJob.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleSave(selectedJob, e)}
                      disabled={savingIds.has(selectedJob._id)}
                      className={cn(
                        'p-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50',
                        savedJobIds.has(selectedJob._id)
                          ? 'text-brand-teal border-brand-teal/30 bg-brand-aqua/20'
                          : 'text-slate-400 border-slate-200 hover:border-brand-teal/30'
                      )}
                    >
                      {savedJobIds.has(selectedJob._id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                    {selectedJob.sourceUrl && (
                      <a href={selectedJob.sourceUrl} target="_blank" rel="noreferrer">
                        <Button variant="secondary" size="sm" rightIcon={<ExternalLink size={14} />}>View on Site</Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    {
                      icon: DollarSign,
                      label: 'Salary',
                      value: selectedJob.salary
                        ? formatSalary(selectedJob.salary.min, selectedJob.salary.max)
                        : 'Not listed',
                    },
                    { icon: Briefcase, label: 'Type', value: selectedJob.type.replace('-', ' ') },
                    { icon: Clock, label: 'Posted', value: timeAgo(selectedJob.postedAt) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-slate-50/80 rounded-xl p-3">
                      <Icon size={13} className="text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-xs font-semibold text-slate-700 capitalize">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Match score */}
                {selectedJob.matchScore != null && (
                  <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-brand-aqua/30 to-brand-frost/60 border border-brand-teal/15 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap size={15} className="text-brand-teal" />
                      <span className="text-sm font-semibold text-slate-700">
                        <strong className={selectedJob.matchScore >= 90 ? 'text-emerald-600' : 'text-brand-teal'}>
                          {selectedJob.matchScore}% match
                        </strong>{' '}
                        based on your profile
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {selectedJob.skills.slice(0, 4).map(s => (
                        <Badge key={s} variant="teal" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Job body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scroll-hide">
                {selectedJob.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">About the Role</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Skills Required</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map(s => (
                        <Badge key={s} variant="teal">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.benefits.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map(b => (
                        <div key={b} className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                          <Star size={10} className="fill-emerald-500 stroke-emerald-500" />
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.requirements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Requirements</h3>
                    <ul className="space-y-1.5">
                      {selectedJob.requirements.slice(0, 6).map((r, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-1.5 flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="p-5 border-t border-slate-100 flex gap-3">
                <Button
                  fullWidth
                  size="lg"
                  leftIcon={applyingIds.has(selectedJob._id) ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  loading={applyingIds.has(selectedJob._id)}
                  disabled={!selectedJob.sourceUrl || applyingIds.has(selectedJob._id)}
                  onClick={() => handleAutoApply(selectedJob)}
                  title={!selectedJob.sourceUrl ? 'No external URL available for this job' : undefined}
                >
                  {applyingIds.has(selectedJob._id) ? 'Applying…' : 'One-Click Apply'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Sparkles size={15} />}
                  onClick={() => router.push('/cover-letters')}
                >
                  Generate Cover Letter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
