'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSignature, Plus, Search, Sparkles, Building2,
  Copy, Trash2, Edit3, Eye, Check, X, Loader2, AlertCircle, Save
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn, timeAgo } from '@/lib/utils'
import api, { coverLetterAPI } from '@/lib/api'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────
// jobId is populated by Mongoose .populate('jobId', 'title company')
interface ApiLetter {
  _id: string
  jobId?: { title: string; company: { name: string } | string } | null
  content: string
  tone: Tone
  edited: boolean
  used: boolean
  createdAt: string
}

type Tone = 'professional' | 'enthusiastic' | 'formal' | 'creative'

// ── Helpers ───────────────────────────────────────────────────
const LOGO_GRADIENTS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
  'from-teal-500 to-cyan-600',    'from-emerald-500 to-green-600',
  'from-orange-500 to-amber-600', 'from-rose-500 to-pink-600',
  'from-slate-600 to-slate-800',  'from-indigo-400 to-blue-500',
]
function getLogoColor(name: string) {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0)
  return LOGO_GRADIENTS[code % LOGO_GRADIENTS.length]
}
function getJobTitle(l: ApiLetter) { return l.jobId?.title || 'Custom Letter' }
function getCompanyName(l: ApiLetter) {
  const c = l.jobId?.company
  if (!c) return ''
  return typeof c === 'string' ? c : c.name || ''
}

const toneConfig: Record<Tone, { label: string; variant: 'info' | 'success' | 'default' | 'teal' }> = {
  professional: { label: 'Professional', variant: 'info' },
  enthusiastic: { label: 'Enthusiastic', variant: 'success' },
  formal:       { label: 'Formal',       variant: 'default' },
  creative:     { label: 'Creative',     variant: 'teal' },
}
const TONES: Tone[] = ['professional', 'enthusiastic', 'formal', 'creative']

export default function CoverLettersPage() {
  const [letters, setLetters]     = useState<ApiLetter[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [selected, setSelected]   = useState<ApiLetter | null>(null)
  const [search, setSearch]       = useState('')
  const [showGenerator, setShowGenerator] = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [newJob, setNewJob] = useState({ title: '', company: '', tone: 'professional' as Tone })
  const [copied, setCopied]       = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  useEffect(() => {
    coverLetterAPI.getAll()
      .then(res => setLetters(res.data.data as ApiLetter[]))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  // ── Generate ──────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!newJob.title || !newJob.company) return
    setGenerating(true)
    try {
      const res = await api.post('/cover-letters/generate', {
        tone: newJob.tone,
        title: newJob.title,
        company: newJob.company,
      })
      const letter = res.data.data as ApiLetter
      setLetters(prev => [letter, ...prev])
      setSelected(letter)
      setShowGenerator(false)
      setNewJob({ title: '', company: '', tone: 'professional' })
      toast.success('Cover letter generated!')
    } catch {
      toast.error('Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setLetters(prev => prev.filter(l => l._id !== id))
    if (selected?._id === id) { setSelected(null); setEditMode(false) }
    try {
      await coverLetterAPI.delete(id)
      toast.success('Deleted')
    } catch {
      try {
        const res = await coverLetterAPI.getAll()
        setLetters(res.data.data as ApiLetter[])
      } catch { /* ignore */ }
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Edit / save ───────────────────────────────────────────
  const startEdit = () => {
    if (!selected) return
    setEditContent(selected.content)
    setEditMode(true)
  }

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await coverLetterAPI.update(selected._id, editContent)
      const updated = res.data.data as ApiLetter
      setLetters(prev => prev.map(l => l._id === updated._id ? updated : l))
      setSelected(updated)
      setEditMode(false)
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Regenerate ────────────────────────────────────────────
  const handleRegenerate = async () => {
    if (!selected) return
    setRegeneratingId(selected._id)
    try {
      const res = await api.post('/cover-letters/generate', {
        tone: selected.tone,
        title: getJobTitle(selected),
        company: getCompanyName(selected),
      })
      const fresh = res.data.data as ApiLetter
      try { await coverLetterAPI.delete(selected._id) } catch { /* ignore */ }
      setLetters(prev => [fresh, ...prev.filter(l => l._id !== selected._id)])
      setSelected(fresh)
      setEditMode(false)
      toast.success('Regenerated!')
    } catch {
      toast.error('Regeneration failed')
    } finally {
      setRegeneratingId(null)
    }
  }

  // ── Copy ──────────────────────────────────────────────────
  const handleCopy = () => {
    if (!selected) return
    navigator.clipboard.writeText(selected.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = letters.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return getJobTitle(l).toLowerCase().includes(q) || getCompanyName(l).toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Cover Letters</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${letters.length} AI-generated cover letter${letters.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button leftIcon={<Plus size={15} />} onClick={() => setShowGenerator(true)}>
          Generate New
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 flex items-center gap-3 text-red-600">
          <AlertCircle size={16} />
          <span className="text-sm">Failed to load cover letters. Please refresh.</span>
        </div>
      )}

      {/* Generator modal */}
      <AnimatePresence>
        {showGenerator && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                      onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                      placeholder="e.g. Stripe"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map(t => (
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
                    {generating ? 'Generating…' : 'Generate'}
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
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cover letters…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-teal/20 bg-white/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal/60 transition-all"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 flex-shrink-0" rounded />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" rounded />
                      <Skeleton className="h-3 w-24" rounded />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" rounded />
                  <Skeleton className="h-3 w-3/4" rounded />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card py-14 text-center">
              <FileSignature size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">
                {letters.length === 0 ? 'No cover letters yet' : 'No matches'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {letters.length === 0 ? 'Generate your first one' : 'Try a different search'}
              </p>
              {letters.length === 0 && (
                <Button size="sm" className="mt-4" leftIcon={<Plus size={13} />} onClick={() => setShowGenerator(true)}>
                  Generate New
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((letter, i) => {
                const jobTitle = getJobTitle(letter)
                const company = getCompanyName(letter)
                const logoColor = getLogoColor(company || jobTitle)
                return (
                  <motion.div
                    key={letter._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setSelected(letter); setEditMode(false) }}
                    className={cn(
                      'glass-card p-4 cursor-pointer transition-all group',
                      selected?._id === letter._id
                        ? 'ring-2 ring-brand-teal/40 bg-brand-aqua/10'
                        : 'hover:bg-slate-50/80'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {(company || jobTitle)[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 truncate">{jobTitle}</p>
                          <Badge variant={letter.used ? 'success' : 'warning'} className="text-[10px]">
                            {letter.used ? 'sent' : 'draft'}
                          </Badge>
                        </div>
                        {company && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 size={10} /> {company}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge variant={toneConfig[letter.tone]?.variant ?? 'default'} className="text-[10px]">
                            {toneConfig[letter.tone]?.label ?? letter.tone}
                          </Badge>
                          <span className="text-xs text-slate-400">{timeAgo(letter.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">{letter.content}</p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Preview / edit panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <motion.div
              key={selected._id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card h-full flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getLogoColor(getCompanyName(selected) || getJobTitle(selected))} flex items-center justify-center text-white font-bold text-sm`}>
                    {(getCompanyName(selected) || getJobTitle(selected))[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{getJobTitle(selected)}</p>
                    <p className="text-xs text-slate-500">
                      {getCompanyName(selected) && `${getCompanyName(selected)} · `}
                      {timeAgo(selected.createdAt)}
                      {selected.edited && ' · edited'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!editMode ? (
                    <>
                      <button onClick={handleCopy} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Copy">
                        {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      </button>
                      <button onClick={startEdit} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Edit">
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(selected._id)}
                        disabled={deletingId === selected._id}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditMode(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Cancel">
                        <X size={15} />
                      </button>
                      <button onClick={saveEdit} disabled={saving} className="p-2 rounded-lg text-slate-400 hover:text-brand-teal hover:bg-brand-aqua/30 transition-colors cursor-pointer disabled:opacity-30" title="Save">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Letter body */}
              <div className="flex-1 p-6 overflow-y-auto">
                {editMode ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[300px] text-sm text-slate-700 leading-relaxed bg-transparent border border-brand-teal/20 rounded-xl p-4 resize-none focus:outline-none focus:border-brand-teal/60 transition-all"
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{selected.content}</p>
                )}
              </div>

              {/* Regenerate */}
              {!editMode && (
                <div className="px-5 pb-5">
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth
                    leftIcon={regeneratingId === selected._id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Sparkles size={13} />}
                    loading={regeneratingId === selected._id}
                    onClick={handleRegenerate}
                  >
                    {regeneratingId === selected._id ? 'Regenerating…' : 'Regenerate with AI'}
                  </Button>
                </div>
              )}
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
