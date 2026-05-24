'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, MapPin, Briefcase, Building2, Clock, DollarSign,
  Bookmark, BookmarkCheck, Sparkles, SlidersHorizontal, X, ChevronDown,
  Star, Zap, ArrowUpRight, Globe, Users, ExternalLink
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn, formatSalary, timeAgo } from '@/lib/utils'

// ── Mock Jobs ─────────────────────────────────────────────────
const mockJobs = [
  {
    id: '1', title: 'Senior Frontend Engineer', company: 'Stripe', logo: 'S',
    logoColor: 'from-violet-500 to-purple-600', location: 'San Francisco, CA', remote: 'hybrid',
    salary: { min: 160000, max: 200000, currency: 'USD', period: 'yearly' },
    type: 'full-time', skills: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
    matchScore: 96, description: 'Join Stripe\'s platform team to build the next generation of payment infrastructure used by millions of businesses worldwide.',
    benefits: ['$200K equity', 'Unlimited PTO', 'Remote stipend'],
    experience: '5+ years', postedAt: '2024-12-10T08:00:00Z', isSaved: false, applicants: 142,
  },
  {
    id: '2', title: 'React Developer', company: 'Vercel', logo: '▲',
    logoColor: 'from-slate-700 to-slate-900', location: 'Remote', remote: 'remote',
    salary: { min: 140000, max: 175000, currency: 'USD', period: 'yearly' },
    type: 'full-time', skills: ['React', 'Next.js', 'TypeScript', 'CSS'],
    matchScore: 92, description: 'Help build the future of the web with Vercel\'s frontend cloud platform. Work on developer experience tools used by millions.',
    benefits: ['Fully remote', 'Home office budget', 'Learning budget'],
    experience: '3+ years', postedAt: '2024-12-11T10:00:00Z', isSaved: true, applicants: 89,
  },
  {
    id: '3', title: 'Full Stack Engineer', company: 'Linear', logo: 'L',
    logoColor: 'from-indigo-500 to-blue-600', location: 'New York, NY', remote: 'hybrid',
    salary: { min: 130000, max: 165000, currency: 'USD', period: 'yearly' },
    type: 'full-time', skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    matchScore: 88, description: 'Build the project management tool loved by engineering teams. Work on challenging distributed systems problems at scale.',
    benefits: ['Equity package', 'Health insurance', '401k matching'],
    experience: '4+ years', postedAt: '2024-12-09T14:00:00Z', isSaved: false, applicants: 67,
  },
  {
    id: '4', title: 'Staff Software Engineer', company: 'Notion', logo: 'N',
    logoColor: 'from-slate-600 to-slate-800', location: 'San Francisco, CA', remote: 'hybrid',
    salary: { min: 200000, max: 250000, currency: 'USD', period: 'yearly' },
    type: 'full-time', skills: ['React', 'TypeScript', 'Electron', 'Databases'],
    matchScore: 84, description: 'Help Notion become the connected workspace for the world. Work on the core editor and collaboration features.',
    benefits: ['High equity', 'Catered meals', 'Top-tier benefits'],
    experience: '7+ years', postedAt: '2024-12-08T09:00:00Z', isSaved: false, applicants: 203,
  },
  {
    id: '5', title: 'Frontend Engineer', company: 'Figma', logo: 'F',
    logoColor: 'from-pink-500 to-rose-600', location: 'Remote', remote: 'remote',
    salary: { min: 150000, max: 190000, currency: 'USD', period: 'yearly' },
    type: 'full-time', skills: ['React', 'WebGL', 'Canvas API', 'TypeScript'],
    matchScore: 80, description: 'Work on Figma\'s web-based design tool. Build high-performance graphics rendering and collaboration features.',
    benefits: ['Remote-first', 'Annual offsite', 'Equipment budget'],
    experience: '4+ years', postedAt: '2024-12-07T16:00:00Z', isSaved: true, applicants: 178,
  },
  {
    id: '6', title: 'Software Engineer II', company: 'GitHub', logo: 'G',
    logoColor: 'from-gray-700 to-gray-900', location: 'Remote', remote: 'remote',
    salary: { min: 130000, max: 170000, currency: 'USD', period: 'yearly' },
    type: 'full-time', skills: ['React', 'Ruby on Rails', 'TypeScript', 'GraphQL'],
    matchScore: 78, description: 'Join GitHub to build developer tooling and collaboration features. Work on products that millions of developers use daily.',
    benefits: ['Fully remote', 'Flexible hours', 'Conference budget'],
    experience: '3+ years', postedAt: '2024-12-06T11:00:00Z', isSaved: false, applicants: 312,
  },
]

type SortOption = 'match' | 'recent' | 'salary'

export default function JobsPage() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [selectedJob, setSelectedJob] = useState(mockJobs[0])
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set(['2', '5']))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('match')
  const [remoteFilter, setRemoteFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [coverLetterJob, setCoverLetterJob] = useState<string | null>(null)

  const toggleSave = (id: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = mockJobs
    .filter(j => {
      const matchesQuery = !query || j.title.toLowerCase().includes(query.toLowerCase()) || j.company.toLowerCase().includes(query.toLowerCase()) || j.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
      const matchesLocation = !location || j.location.toLowerCase().includes(location.toLowerCase())
      const matchesRemote = !remoteFilter || j.remote === remoteFilter
      const matchesType = !typeFilter || j.type === typeFilter
      return matchesQuery && matchesLocation && matchesRemote && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore
      if (sortBy === 'recent') return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      if (sortBy === 'salary') return b.salary.max - a.salary.max
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
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search jobs, companies, skills..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 focus:bg-white transition-all"
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
                          remoteFilter === r
                            ? 'bg-brand-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                          typeFilter === t
                            ? 'bg-brand-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                          sortBy === val
                            ? 'bg-brand-teal text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

      {/* Results */}
      <div className="flex gap-5 h-[calc(100dvh-280px)] min-h-[500px]">
        {/* Job list */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 overflow-y-auto space-y-3 scroll-hide pb-4">
          <div className="flex items-center justify-between mb-1 px-0.5">
            <p className="text-sm text-slate-500">
              <strong className="text-slate-800">{filtered.length}</strong> jobs found
            </p>
            <p className="text-xs text-brand-teal font-medium flex items-center gap-1">
              <Sparkles size={11} /> AI-ranked by match
            </p>
          </div>

          {filtered.map((job, i) => {
            const saved = savedJobs.has(job.id)
            const active = selectedJob.id === job.id

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => setSelectedJob(job)}
                className={cn(
                  'p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative',
                  active
                    ? 'bg-white border-brand-teal/40 shadow-card-hover ring-1 ring-brand-teal/20'
                    : 'glass-card hover:shadow-card-hover hover:border-brand-teal/20'
                )}
              >
                {/* Match badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    job.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700' :
                    job.matchScore >= 80 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  )}>
                    {job.matchScore}%
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSave(job.id) }}
                    className={cn(
                      'p-1 rounded-lg transition-colors cursor-pointer',
                      saved ? 'text-brand-teal hover:text-slate-400' : 'text-slate-300 hover:text-brand-teal'
                    )}
                    aria-label={saved ? 'Unsave job' : 'Save job'}
                  >
                    {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                </div>

                <div className="flex items-start gap-3 pr-16">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${job.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                    {job.logo}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign size={11} />{formatSalary(job.salary.min, job.salary.max, job.salary.currency, job.salary.period)}</span>
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
          })}
        </div>

        {/* Job detail panel */}
        <AnimatePresence mode="wait">
          {selectedJob && (
            <motion.div
              key={selectedJob.id}
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
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedJob.logoColor} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md`}>
                      {selectedJob.logo}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedJob.title}</h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Building2 size={13} />{selectedJob.company}</span>
                        <span className="flex items-center gap-1"><MapPin size={13} />{selectedJob.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSave(selectedJob.id)}
                      className={cn(
                        'p-2.5 rounded-xl border transition-all cursor-pointer',
                        savedJobs.has(selectedJob.id)
                          ? 'text-brand-teal border-brand-teal/30 bg-brand-aqua/20'
                          : 'text-slate-400 border-slate-200 hover:border-brand-teal/30'
                      )}
                    >
                      {savedJobs.has(selectedJob.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                    </button>
                    <a href={selectedJob.id} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm" rightIcon={<ExternalLink size={14} />}>View on Site</Button>
                    </a>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 mt-5">
                  {[
                    { icon: DollarSign, label: 'Salary', value: formatSalary(selectedJob.salary.min, selectedJob.salary.max) },
                    { icon: Briefcase, label: 'Type', value: selectedJob.type.replace('-', ' ') },
                    { icon: Users, label: 'Applicants', value: `${selectedJob.applicants}+` },
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
                <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-brand-aqua/30 to-brand-frost/60 border border-brand-teal/15 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Zap size={15} className="text-brand-teal" />
                    <span className="text-sm font-semibold text-slate-700">
                      <strong className={selectedJob.matchScore >= 90 ? 'text-emerald-600' : 'text-brand-teal'}>{selectedJob.matchScore}% match</strong> based on your profile
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {selectedJob.skills.slice(0, 4).map(s => (
                      <Badge key={s} variant="teal" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Job body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">About the Role</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedJob.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map(s => (
                      <Badge key={s} variant="teal">{s}</Badge>
                    ))}
                  </div>
                </div>

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
              </div>

              {/* Action buttons */}
              <div className="p-5 border-t border-slate-100 flex gap-3">
                <Button
                  fullWidth
                  size="lg"
                  leftIcon={<Zap size={15} />}
                  onClick={() => setCoverLetterJob(selectedJob.id)}
                >
                  One-Click Apply
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<Sparkles size={15} />}
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
