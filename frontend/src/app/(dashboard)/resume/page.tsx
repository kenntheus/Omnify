'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle, AlertCircle, TrendingUp,
  Zap, Target, Star, ChevronDown, ChevronUp, Download,
  RefreshCw, Sparkles, ArrowUpRight, Brain, Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ScoreRing from '@/components/ui/ScoreRing'
import Card from '@/components/ui/Card'

// ── Mock analysis data ────────────────────────────────────────
const mockAnalysis = {
  atsScore: 87,
  overallScore: 82,
  formattingScore: 90,
  contentScore: 85,
  impactScore: 72,
  skills: [
    { name: 'React', category: 'technical', proficiency: 'expert', yearsOfExperience: 4 },
    { name: 'TypeScript', category: 'technical', proficiency: 'advanced', yearsOfExperience: 3 },
    { name: 'Node.js', category: 'technical', proficiency: 'advanced', yearsOfExperience: 3 },
    { name: 'GraphQL', category: 'technical', proficiency: 'intermediate', yearsOfExperience: 2 },
    { name: 'Python', category: 'technical', proficiency: 'intermediate', yearsOfExperience: 2 },
    { name: 'AWS', category: 'tool', proficiency: 'intermediate', yearsOfExperience: 2 },
    { name: 'Team Leadership', category: 'soft', proficiency: 'advanced' },
    { name: 'Agile/Scrum', category: 'soft', proficiency: 'advanced' },
  ],
  keywords: ['TypeScript', 'React', 'REST API', 'CI/CD', 'Docker', 'Microservices'],
  strengths: [
    'Strong technical background in modern web technologies',
    'Clear quantified achievements (e.g., "improved performance by 40%")',
    'Good education section with relevant coursework',
    'Professional summary clearly communicates value proposition',
  ],
  improvements: [
    { category: 'keywords', priority: 'high', title: 'Add missing ATS keywords', description: 'Include "system design", "distributed systems", and "cross-functional" to match more job postings.', example: '"Led cross-functional teams to design distributed systems..."' },
    { category: 'impact', priority: 'high', title: 'Quantify more achievements', description: '4 of your 9 bullet points lack measurable outcomes. Add numbers, percentages, or scale.', example: '"Reduced page load time by 35%, improving user retention by 18%"' },
    { category: 'content', priority: 'medium', title: 'Add a Skills section', description: 'A dedicated skills section makes your resume more scannable by ATS and recruiters.', example: 'Technical: React, TypeScript, Node.js | Tools: Git, Docker, AWS' },
    { category: 'formatting', priority: 'low', title: 'Use consistent date format', description: 'Mix of "Jan 2022" and "01/2022" — standardize to one format throughout.', example: 'Use "Jan 2022 – Present" for all positions' },
  ],
}

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
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'suggestions'>('overview')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setAnalyzed(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const analyze = async () => {
    setAnalyzing(true)
    await new Promise(r => setTimeout(r, 2500))
    setAnalyzing(false)
    setAnalyzed(true)
    setActiveTab('overview')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Resume Analyzer</h1>
        <p className="page-subtitle">Upload your resume for AI-powered ATS scoring and improvement suggestions</p>
      </div>

      {/* Upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-6"
      >
        {!analyzed ? (
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
                  onClick={analyze}
                  loading={analyzing}
                  leftIcon={<Sparkles size={16} />}
                  size="lg"
                >
                  {analyzing ? 'Analyzing with AI...' : 'Analyze Resume'}
                </Button>
                <Button variant="secondary" onClick={() => setFile(null)} size="lg">
                  Remove
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{file?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">Analyzed · Last updated just now</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={() => { setAnalyzed(false); setFile(null) }}>
                Re-upload
              </Button>
              <Button variant="secondary" size="sm" leftIcon={<Download size={14} />}>
                Download Report
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Analysis results */}
      <AnimatePresence>
        {analyzed && (
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
                <ScoreRing score={mockAnalysis.atsScore} size={120} label="ATS Score" sublabel="Compatibility" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">
                    {mockAnalysis.atsScore >= 80 ? 'Great' : mockAnalysis.atsScore >= 60 ? 'Good' : 'Needs Work'}!
                  </h3>
                  <p className="text-sm text-slate-500">
                    Your resume will pass most ATS systems. A few tweaks will make it even stronger.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="success" dot>ATS Compatible</Badge>
                    <Badge variant="teal" dot>87% Match Rate</Badge>
                  </div>
                </div>
              </div>

              {[
                { label: 'Overall', score: mockAnalysis.overallScore, icon: Target, color: 'text-brand-teal', bg: 'bg-brand-aqua/30' },
                { label: 'Content', score: mockAnalysis.contentScore, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Formatting', score: mockAnalysis.formattingScore, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Impact', score: mockAnalysis.impactScore, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(({ label, score, icon: Icon, color, bg }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -2 }}
                  className="glass-card p-4 flex flex-col items-center justify-center gap-3"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                    <Icon size={16} className={color} />
                  </div>
                  <ScoreRing score={score} size={72} strokeWidth={6} />
                  <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <div className="glass-card overflow-hidden">
              <div className="flex border-b border-slate-100">
                {(['overview', 'skills', 'suggestions'] as const).map((tab) => (
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
                    {tab === 'suggestions' && (
                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        {mockAnalysis.improvements.filter(i => i.priority === 'high').length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview tab */}
                {activeTab === 'overview' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award size={16} className="text-emerald-600" />
                        <h4 className="text-sm font-semibold text-slate-700">Strengths</h4>
                      </div>
                      <ul className="space-y-2.5">
                        {mockAnalysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target size={16} className="text-amber-600" />
                        <h4 className="text-sm font-semibold text-slate-700">Key Keywords Found</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mockAnalysis.keywords.map((k) => (
                          <Badge key={k} variant="teal">{k}</Badge>
                        ))}
                      </div>
                      <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/60">
                        <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                          <AlertCircle size={13} /> Missing High-Impact Keywords
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {['system design', 'distributed systems', 'cross-functional', 'OKR'].map((k) => (
                            <span key={k} className="text-xs bg-white/80 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills tab */}
                {activeTab === 'skills' && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                      {Object.entries(categoryColors).map(([cat, colors]) => {
                        const count = mockAnalysis.skills.filter(s => s.category === cat).length
                        return (
                          <div key={cat} className={cn('rounded-xl p-3 text-center', colors)}>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-xs capitalize">{cat}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {mockAnalysis.skills.map((skill) => (
                        <div key={skill.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('w-2 h-2 rounded-full', skill.category === 'technical' ? 'bg-violet-500' : skill.category === 'soft' ? 'bg-teal-500' : 'bg-orange-500')} />
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
                  </div>
                )}

                {/* Suggestions tab */}
                {activeTab === 'suggestions' && (
                  <div className="space-y-3">
                    {mockAnalysis.improvements.map((imp, i) => (
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
                          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border', priorityConfig[imp.priority].color)}>
                            {imp.priority === 'high' ? <AlertCircle size={14} /> : <TrendingUp size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">{imp.title}</p>
                              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', priorityConfig[imp.priority].color)}>
                                {priorityConfig[imp.priority].label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{imp.description}</p>
                          </div>
                          {expandedSuggestion === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
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
                                    <p className="text-xs font-semibold text-brand-teal mb-1">✨ Example</p>
                                    <p className="text-xs text-slate-600 font-mono">{imp.example}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Generate cover letters CTA */}
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
              <Button size="sm" rightIcon={<ArrowUpRight size={14} />}>
                Generate Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
