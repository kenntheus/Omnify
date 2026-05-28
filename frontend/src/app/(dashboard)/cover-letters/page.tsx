'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSignature, Plus, Search, Sparkles, Briefcase, Calendar,
  Copy, Trash2, Edit3, Eye, ChevronRight, Building2, Check, X
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface CoverLetter {
  id: string
  jobTitle: string
  company: string
  companyLogo: string
  logoColor: string
  tone: 'professional' | 'enthusiastic' | 'concise'
  createdAt: string
  preview: string
  status: 'draft' | 'sent'
}

const mockLetters: CoverLetter[] = [
  {
    id: '1',
    jobTitle: 'Senior Frontend Engineer',
    company: 'Stripe',
    companyLogo: 'S',
    logoColor: 'from-violet-500 to-purple-600',
    tone: 'professional',
    createdAt: 'Dec 10, 2024',
    preview: "Dear Hiring Manager, I am excited to apply for the Senior Frontend Engineer position at Stripe. With 5+ years of experience building high-performance React applications and a deep passion for developer tools...",
    status: 'sent',
  },
  {
    id: '2',
    jobTitle: 'React Developer',
    company: 'Vercel',
    companyLogo: '▲',
    logoColor: 'from-slate-700 to-slate-900',
    tone: 'enthusiastic',
    createdAt: 'Dec 9, 2024',
    preview: "Hi Vercel Team! I'm thrilled to be applying for the React Developer role. As someone who deploys projects on Vercel daily and has built over 30 production applications with Next.js...",
    status: 'sent',
  },
  {
    id: '3',
    jobTitle: 'Full Stack Engineer',
    company: 'Linear',
    companyLogo: 'L',
    logoColor: 'from-indigo-500 to-blue-600',
    tone: 'concise',
    createdAt: 'Dec 8, 2024',
    preview: "I'm applying for the Full Stack Engineer role at Linear. My background in TypeScript, React, and Node.js aligns closely with your requirements. I've built several productivity tools and...",
    status: 'draft',
  },
  {
    id: '4',
    jobTitle: 'Staff Engineer',
    company: 'Notion',
    companyLogo: 'N',
    logoColor: 'from-slate-600 to-slate-800',
    tone: 'professional',
    createdAt: 'Dec 5, 2024',
    preview: "Dear Notion Engineering Team, I'm writing to express my strong interest in the Staff Engineer position. Notion's mission to make tools for thinking resonates deeply with my belief that great software...",
    status: 'draft',
  },
]

const toneConfig = {
  professional: { label: 'Professional', variant: 'info' as const },
  enthusiastic: { label: 'Enthusiastic', variant: 'success' as const },
  concise: { label: 'Concise', variant: 'warning' as const },
}

const tones = ['professional', 'enthusiastic', 'concise'] as const

export default function CoverLettersPage() {
  const [letters, setLetters] = useState(mockLetters)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CoverLetter | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [newJob, setNewJob] = useState({ title: '', company: '', tone: 'professional' as typeof tones[number] })

  const filtered = letters.filter(l =>
    !search ||
    l.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = () => {
    if (selected) {
      navigator.clipboard.writeText(selected.preview)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = (id: string) => {
    setLetters(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const handleGenerate = async () => {
    if (!newJob.title || !newJob.company) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1500))
    const newLetter: CoverLetter = {
      id: Date.now().toString(),
      jobTitle: newJob.title,
      company: newJob.company,
      companyLogo: newJob.company.charAt(0).toUpperCase(),
      logoColor: 'from-brand-teal to-primary-500',
      tone: newJob.tone,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      preview: `Dear ${newJob.company} Hiring Team, I am writing to express my strong interest in the ${newJob.title} role. My experience and skills make me a great fit for this position...`,
      status: 'draft',
    }
    setLetters(prev => [newLetter, ...prev])
    setGenerating(false)
    setShowGenerator(false)
    setNewJob({ title: '', company: '', tone: 'professional' })
    setSelected(newLetter)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Cover Letters</h1>
          <p className="page-subtitle">AI-generated cover letters tailored to each job</p>
        </div>
        <Button leftIcon={<Plus size={15} />} onClick={() => setShowGenerator(true)}>
          Generate New
        </Button>
      </div>

      {/* Generator modal */}
      <AnimatePresence>
        {showGenerator && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setShowGenerator(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="glass-card p-6 shadow-glass-lg m-4">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-aqua/40 flex items-center justify-center">
                      <Sparkles size={15} className="text-brand-teal" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Generate Cover Letter</h3>
                  </div>
                  <button
                    onClick={() => setShowGenerator(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
                    <input
                      value={newJob.title}
                      onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                    <input
                      value={newJob.company}
                      onChange={e => setNewJob(p => ({ ...p, company: e.target.value }))}
                      placeholder="e.g. Stripe"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tone</label>
                    <div className="grid grid-cols-3 gap-2">
                      {tones.map(t => (
                        <button
                          key={t}
                          onClick={() => setNewJob(p => ({ ...p, tone: t }))}
                          className={cn(
                            'py-2 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer border',
                            newJob.tone === t
                              ? 'bg-brand-teal text-white border-brand-teal'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/40'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="secondary" fullWidth onClick={() => setShowGenerator(false)}>Cancel</Button>
                  <Button
                    fullWidth
                    loading={generating}
                    leftIcon={<Sparkles size={14} />}
                    onClick={handleGenerate}
                    disabled={!newJob.title || !newJob.company}
                  >
                    {generating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Letter list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cover letters..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card py-14 text-center">
              <FileSignature size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No cover letters yet</p>
              <p className="text-xs text-slate-400 mt-1">Generate your first one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((letter, i) => (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(letter)}
                  className={cn(
                    'glass-card p-4 cursor-pointer transition-all group',
                    selected?.id === letter.id
                      ? 'ring-2 ring-brand-teal/40 bg-brand-aqua/10'
                      : 'hover:bg-slate-50/80'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${letter.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {letter.companyLogo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">{letter.jobTitle}</p>
                        <Badge variant={letter.status === 'sent' ? 'success' : 'warning'} className="text-[10px]">
                          {letter.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 size={10} /> {letter.company}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <Badge variant={toneConfig[letter.tone].variant} className="text-[10px]">
                          {toneConfig[letter.tone].label}
                        </Badge>
                        <span className="text-xs text-slate-400">{letter.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">{letter.preview}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card h-full"
            >
              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selected.logoColor} flex items-center justify-center text-white font-bold text-sm`}>
                    {selected.companyLogo}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{selected.jobTitle}</p>
                    <p className="text-xs text-slate-500">{selected.company} · {selected.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Copy"
                  >
                    {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                  </button>
                  <button
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Letter content */}
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{selected.preview}</p>
                  <p className="text-slate-400 text-xs mt-4 italic">— Full letter preview. Click Edit to modify.</p>
                </div>
              </div>

              <div className="px-5 pb-5">
                <Button size="sm" leftIcon={<Sparkles size={13} />} variant="secondary" fullWidth>
                  Regenerate with AI
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-aqua/40 flex items-center justify-center mx-auto mb-4">
                <Eye size={22} className="text-brand-teal" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Select a cover letter to preview</p>
              <p className="text-xs text-slate-400 mt-1">Or generate a new one with AI</p>
              <div className="mt-5">
                <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowGenerator(true)}>
                  Generate New
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
