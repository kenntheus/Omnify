'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle, AlertCircle, TrendingUp,
  Zap, Target, ChevronDown, ChevronUp, Download,
  RefreshCw, Sparkles, ArrowUpRight, Brain, Award, Loader2, Trash2
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ScoreRing from '@/components/ui/ScoreRing'
import Skeleton from '@/components/ui/Skeleton'
import { resumeAPI } from '@/lib/api'
import type { Resume } from '@/types'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ── Visual helpers ─────────────────────────────────────────────
const proficiencyColors: Record<string, string> = {
  expert: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  advanced: 'bg-blue-50 text-blue-700 border-blue-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  beginner: 'bg-slate-50 text-slate-600 border-slate-200',
}

const categoryColors: Record<string, string> = {
  technical: 'bg-violet-50 text-violet-700',
  soft: 'bg-teal-50 text-teal-700',
  tool: 'bg-orange-50 text-orange-700',
  language: 'bg-pink-50 text-pink-700',
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: 'text-red-600 bg-red-50 border-red-200', label: 'High Priority' },
  medium: { color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Medium' },
  low: { color: 'text-slate-500 bg-slate-50 border-slate-200', label: 'Low' },
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selected, setSelected] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing'>('idle')
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'suggestions'>('overview')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    resumeAPI.getAll()
      .then(res => {
        const list = res.data.data as Resume[]
        setResumes(list)
        const def = list.find(r => r.isDefault) || list[0] || null
        setSelected(def)
      })
      .catch(() => { /* no-op — show upload zone */ })
      .finally(() => setLoading(false))
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setSelected(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  // Upload a new file, then trigger analysis
  const analyzeNew = async () => {
    if (!file) return
    try {
      setUploadState('uploading')
      const uploadRes = await resumeAPI.upload(file)
      const uploaded = uploadRes.data.data as Resume

      setUploadState('analyzing')
      const analyzeRes = await resumeAPI.analyze(uploaded._id)
      const analyzed = analyzeRes.data.data as Resume

      setResumes(prev => [analyzed, ...prev.filter(r => r._id !== analyzed._id)])
      setSelected(analyzed)
      setFile(null)
      setActiveTab('overview')
      toast.success('Resume analyzed successfully')
    } catch {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setUploadState('idle')
    }
  }

  // Re-analyze an already-uploaded resume
  const reanalyze = async () => {
    if (!selected) return
    try {
      setUploadState('analyzing')
      const res = await resumeAPI.analyze(selected._id)
      const analyzed = res.data.data as Resume
      setResumes(prev => prev.map(r => r._id === analyzed._id ? analyzed : r))
      setSelected(analyzed)
      setActiveTab('overview')
      toast.success('Resume re-analyzed')
    } catch {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setUploadState('idle')
    }
  }

  const deleteResume = async (id: string) => {
    setDeletingId(id)
    try {
      await resumeAPI.delete(id)
      const next = resumes.filter(r => r._id !== id)
      setResumes(next)
      if (selected?._id === id) {
        setSelected(next[0] || null)
        setFile(null)
      }
      toast.success('Resume deleted')
    } catch {
      toast.error('Failed to delete resume')
    } finally {
      setDeletingId(null)
    }
  }

  const isProcessing = uploadState !== 'idle'
  const showDropzone = !selected && !isProcessing
  const showNewFileLoading = !selected && isProcessing
  const analysis = selected?.analysis

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Resume Analyzer</h1>
        <p className="page-subtitle">Upload your resume for AI-powered ATS scoring and improvement suggestions</p>
      </div>

      {/* Upload / file card zone */}
      {loading ? (
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 flex-shrink-0" rounded />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" rounded />
              <Skeleton className="h-3 w-32" rounded />
            </div>
            <Skeleton className="h-8 w-24" rounded />
            <Skeleton className="h-8 w-28" rounded />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-6"
        >
          {/* Dropzone — shown when no resume is selected and not processing */}
          {showDropzone && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer',
                  isDragActive
                    ? 'border-brand-teal bg-brand-aqua/20 scale-[1.01]'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-brand-teal/30 bg-slate-50/50 hover:border-brand-teal/60 hover:bg-brand-aqua/10'
                )}
              >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle size={28} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{file.name}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.includes('pdf') ? 'PDF' : 'DOCX'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">Click to replace</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200',
                        isDragActive ? 'bg-brand-teal/20' : 'bg-brand-aqua/40'
                      )}>
                        <Upload size={26} className={isDragActive ? 'text-brand-teal' : 'text-slate-400'} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">
                          {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          Drag & drop or click · PDF or DOCX · Max 10MB
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-3"
                >
                  <Button
                    onClick={analyzeNew}
                    loading={isProcessing}
                    leftIcon={<Sparkles size={16} />}
                    size="lg"
                  >
                    Analyze Resume
                  </Button>
                  <Button variant="secondary" onClick={() => setFile(null)} size="lg">
                    Remove
                  </Button>
                </motion.div>
              )}

              {resumes.length > 0 && !file && (
                <p className="text-center text-xs text-slate-400">
                  <button
                    onClick={() => setSelected(resumes.find(r => r.isDefault) || resumes[0])}
                    className="text-brand-teal hover:underline cursor-pointer"
                  >
                    ← Back to existing resume
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Processing a new file — loading panel inside the card */}
          {showNewFileLoading && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-aqua/40 flex items-center justify-center">
                <Loader2 size={26} className="text-brand-teal animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">
                  {uploadState === 'uploading' ? 'Uploading resume…' : 'Analyzing with AI…'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {uploadState === 'uploading'
                    ? 'Securely uploading your file'
                    : 'Extracting skills and checking ATS compatibility — this may take up to a minute'}
                </p>
              </div>
            </div>
          )}

          {/* Selected resume file card */}
          {selected && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <FileText size={22} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{selected.fileName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isProcessing
                    ? uploadState === 'uploading' ? 'Uploading…' : 'Analyzing with AI…'
                    : analysis
                    ? `Analyzed · ${timeAgo(analysis.analyzedAt)}`
                    : 'Not yet analyzed'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  onClick={reanalyze}
                  loading={isProcessing}
                  disabled={isProcessing}
                >
                  {analysis ? 'Re-analyze' : 'Analyze Now'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload size={14} />}
                  onClick={() => { setSelected(null); setFile(null) }}
                  disabled={isProcessing}
                >
                  Upload New
                </Button>
                <a
                  href={`${API_URL}${selected.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
                    Download
                  </Button>
                </a>
                <button
                  onClick={() => deleteResume(selected._id)}
                  disabled={deletingId === selected._id || isProcessing}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30"
                  aria-label="Delete resume"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Resume switcher — only shown when user has multiple resumes */}
      {!loading && resumes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Your resumes:</span>
          {resumes.map(r => (
            <button
              key={r._id}
              onClick={() => { setSelected(r); setFile(null) }}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border',
                selected?._id === r._id
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-teal/60 hover:text-brand-teal'
              )}
            >
              {r.fileName}
              {r.isDefault && <span className="ml-1 opacity-60">(default)</span>}
            </button>
          ))}
        </div>
      )}

      {/* Analysis results */}
      <AnimatePresence>
        {analysis && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Score cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 glass-card p-6 flex items-center gap-6">
                <ScoreRing score={analysis.atsScore} size={120} label="ATS Score" sublabel="Compatibility" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">
                    {analysis.atsScore >= 80 ? 'Great' : analysis.atsScore >= 60 ? 'Good' : 'Needs Work'}!
                  </h3>
                  <p className="text-sm text-slate-500">
                    {analysis.atsScore >= 80
                      ? 'Your resume will pass most ATS systems. A few tweaks will make it even stronger.'
                      : analysis.atsScore >= 60
                      ? 'Your resume passes many ATS systems but has room for improvement.'
                      : 'Your resume needs work to consistently pass ATS filters.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant={analysis.atsScore >= 70 ? 'success' : 'default'} dot>
                      {analysis.atsScore >= 70 ? 'ATS Compatible' : 'Needs Improvement'}
                    </Badge>
                    <Badge variant="teal" dot>{analysis.atsScore}% Score</Badge>
                  </div>
                </div>
              </div>

              {([
                { label: 'Overall', score: analysis.overallScore, icon: Target, color: 'text-brand-teal', bg: 'bg-brand-aqua/30' },
                { label: 'Content', score: analysis.contentScore, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Formatting', score: analysis.formattingScore, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Impact', score: analysis.impactScore, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
              ] as const).map(({ label, score, icon: Icon, color, bg }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -2 }}
                  className="glass-card p-4 flex flex-col items-center justify-center gap-3"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                    <Icon size={16} className={color} />
                  </div>
                  <ScoreRing score={score ?? 0} size={72} strokeWidth={6} />
                  <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <div className="glass-card overflow-hidden">
              <div className="flex border-b border-slate-100">
                {(['overview', 'skills', 'suggestions'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 py-3.5 text-sm font-medium transition-all duration-200 capitalize cursor-pointer',
                      activeTab === tab
                        ? 'text-brand-teal border-b-2 border-brand-teal bg-brand-aqua/10'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/80'
                    )}
                  >
                    {tab}
                    {tab === 'suggestions' && analysis.improvements.filter(i => i.priority === 'high').length > 0 && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {analysis.improvements.filter(i => i.priority === 'high').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview */}
                {activeTab === 'overview' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award size={16} className="text-emerald-600" />
                        <h4 className="text-sm font-semibold text-slate-700">Strengths</h4>
                      </div>
                      {analysis.strengths.length === 0 ? (
                        <p className="text-xs text-slate-400">No strengths identified</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {analysis.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <CheckCircle size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-600">{s}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target size={16} className="text-amber-600" />
                        <h4 className="text-sm font-semibold text-slate-700">Key Keywords Found</h4>
                      </div>
                      {analysis.keywords.length === 0 ? (
                        <p className="text-xs text-slate-400">No keywords extracted</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {analysis.keywords.map(k => (
                            <Badge key={k} variant="teal">{k}</Badge>
                          ))}
                        </div>
                      )}
                      {(() => {
                        const kwImp = analysis.improvements.find(i => i.category === 'keywords')
                        return kwImp ? (
                          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/60">
                            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                              <AlertCircle size={13} /> {kwImp.title}
                            </p>
                            <p className="text-xs text-amber-700/80">{kwImp.description}</p>
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {activeTab === 'skills' && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                      {Object.entries(categoryColors).map(([cat, colors]) => {
                        const count = analysis.skills.filter(s => s.category === cat).length
                        return (
                          <div key={cat} className={cn('rounded-xl p-3 text-center', colors)}>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-xs capitalize">{cat}</p>
                          </div>
                        )
                      })}
                    </div>
                    {analysis.skills.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No skills extracted from this resume</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {analysis.skills.map(skill => (
                          <div key={skill.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className={cn('w-2 h-2 rounded-full',
                                skill.category === 'technical' ? 'bg-violet-500' :
                                skill.category === 'soft' ? 'bg-teal-500' :
                                skill.category === 'language' ? 'bg-pink-500' : 'bg-orange-500'
                              )} />
                              <span className="text-sm font-medium text-slate-700">{skill.name}</span>
                              {skill.yearsOfExperience && (
                                <span className="text-xs text-slate-400">{skill.yearsOfExperience}y</span>
                              )}
                            </div>
                            <Badge className={cn('text-xs border', proficiencyColors[skill.proficiency || 'intermediate'])}>
                              {skill.proficiency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {activeTab === 'suggestions' && (
                  <div className="space-y-3">
                    {analysis.improvements.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-slate-600">No suggestions — your resume looks great!</p>
                      </div>
                    ) : (
                      analysis.improvements.map((imp, i) => {
                        const pc = priorityConfig[imp.priority] || priorityConfig.low
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-xl border bg-white/60 overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedSuggestion(expandedSuggestion === i ? null : i)}
                              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >
                              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border', pc.color)}>
                                {imp.priority === 'high' ? <AlertCircle size={14} /> : <TrendingUp size={14} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-800">{imp.title}</p>
                                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', pc.color)}>
                                    {pc.label}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{imp.description}</p>
                              </div>
                              {expandedSuggestion === i
                                ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
                                : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                            </button>

                            <AnimatePresence>
                              {expandedSuggestion === i && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                                    <p className="text-sm text-slate-600 mb-3">{imp.description}</p>
                                    {imp.example && (
                                      <div className="bg-brand-aqua/20 border border-brand-teal/20 rounded-xl p-3">
                                        <p className="text-xs font-semibold text-brand-teal mb-1">Example</p>
                                        <p className="text-xs text-slate-600 font-mono">{imp.example}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cover letter CTA */}
            <div className="glass-card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Generate AI Cover Letters</p>
                  <p className="text-xs text-slate-500">Use your resume to auto-generate personalized cover letters</p>
                </div>
              </div>
              <Button size="sm" rightIcon={<ArrowUpRight size={14} />}>Generate Now</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-analyze loading overlay (replacing the results section) */}
      <AnimatePresence>
        {isProcessing && selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-10 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-aqua/40 flex items-center justify-center">
              <Loader2 size={28} className="text-brand-teal animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Analyzing with AI…</p>
              <p className="text-sm text-slate-500 mt-1">
                Extracting skills and checking ATS compatibility — this may take up to a minute
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
