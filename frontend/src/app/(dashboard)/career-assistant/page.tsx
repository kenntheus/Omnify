'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, Brain, TrendingUp, DollarSign, Lightbulb,
  MessageSquare, Code, Users, Target, BookOpen, ChevronRight,
  Bot, User, RefreshCw, Copy, ThumbsUp, ThumbsDown
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { careerAPI } from '@/lib/api'
import type { CareerInsight } from '@/types'

const initialMessages = [
  {
    id: '1', role: 'assistant' as const,
    content: "Hi! I'm your AI Career Assistant powered by Omnify. I can help you with interview preparation, career insights, salary estimation, skill recommendations, and more.\n\nWhat would you like to work on today?",
    timestamp: new Date(Date.now() - 5000).toISOString(),
  },
]

const quickPrompts = [
  { icon: MessageSquare, label: 'Interview prep', prompt: 'Help me prepare for a frontend engineering interview at a Series B startup' },
  { icon: DollarSign, label: 'Salary negotiation', prompt: 'How should I negotiate a $20K salary increase for a senior frontend role?' },
  { icon: TrendingUp, label: 'Career path', prompt: 'What\'s the best career path from Senior Frontend to Engineering Manager?' },
  { icon: Code, label: 'Technical skills', prompt: 'What technical skills should I learn to become more competitive in 2025?' },
  { icon: Users, label: 'Culture fit', prompt: 'How do I prepare for a culture fit interview at a tech startup?' },
  { icon: BookOpen, label: 'Resume review', prompt: 'Can you review my resume for a principal engineer role?' },
]

const priorityColor: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-emerald-600',
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  loading?: boolean
}

export default function CareerAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [insights, setInsights] = useState<CareerInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeInsight, setActiveInsight] = useState(0)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    careerAPI.getInsights()
      .then(res => setInsights(res.data.data as CareerInsight[]))
      .catch(() => { /* leave empty */ })
      .finally(() => setInsightsLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }

    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      loading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await careerAPI.chat(msg)
      const response: string = res.data.data.response

      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id ? { ...m, loading: false, content: '' } : m
      ))

      // Typewriter effect on real response
      let displayed = ''
      for (let i = 0; i < response.length; i++) {
        displayed += response[i]
        const final = displayed
        setMessages(prev => prev.map(m =>
          m.id === loadingMsg.id ? { ...m, content: final } : m
        ))
        await new Promise(r => setTimeout(r, 8))
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, loading: false, content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-slate-800 mt-3 mb-1">{line.slice(2, -2)}</p>
      }
      if (line.startsWith('**')) {
        return <p key={i} className="font-semibold text-slate-700 mt-2">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.trim() === '') return <br key={i} />
      return <p key={i} className="text-slate-600 leading-relaxed">{line}</p>
    })
  }

  return (
    <div className="flex gap-5 h-[calc(100dvh-112px)] min-h-[500px]">
      {/* Left panel - insights */}
      <div className="hidden xl:flex flex-col w-72 flex-shrink-0 space-y-4">
        {/* AI Assistant info */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Omnify AI</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Powered by advanced language models fine-tuned on career development, interview strategies, and job market data.
          </p>
        </div>

        {/* Career insights */}
        <div className="glass-card p-5 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-brand-teal" /> AI Career Insights
          </h3>
          {insightsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-28" rounded />
                    <Skeleton className="h-3 w-8" rounded />
                  </div>
                  <Skeleton className="h-3 w-full" rounded />
                  <Skeleton className="h-3 w-4/5" rounded />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 2 }}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all duration-200',
                    activeInsight === i
                      ? 'bg-brand-aqua/20 border-brand-teal/30'
                      : 'bg-white/60 border-slate-100 hover:border-brand-teal/20'
                  )}
                  onClick={() => setActiveInsight(i)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-700">{insight.title}</p>
                    <span className={cn('text-xs font-bold capitalize', priorityColor[insight.priority] || 'text-slate-500')}>
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
          <div className="space-y-1.5">
            {quickPrompts.slice(0, 4).map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.prompt)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <p.icon size={13} className="text-brand-teal flex-shrink-0" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">{p.label}</span>
                <ChevronRight size={11} className="text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">AI Career Assistant</p>
              <p className="text-xs text-slate-500">Powered by Omnify AI</p>
            </div>
          </div>
          <button
            onClick={() => setMessages(initialMessages)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={12} /> New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-brand-teal to-primary-500'
                  : 'bg-gradient-to-br from-slate-600 to-slate-800'
              )}>
                {msg.role === 'user'
                  ? <User size={14} className="text-white" />
                  : <Bot size={14} className="text-white" />
                }
              </div>

              <div className={cn('max-w-[80%] space-y-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'px-4 py-3 rounded-2xl text-sm',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-brand-teal to-primary-400 text-white rounded-tr-sm'
                    : 'bg-white/80 border border-slate-100 rounded-tl-sm shadow-card'
                )}>
                  {msg.loading ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          className="w-2 h-2 bg-brand-teal rounded-full"
                        />
                      ))}
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <div className="space-y-0.5">{formatContent(msg.content)}</div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {!msg.loading && msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 px-1">
                    <button
                      onClick={() => {
                        setLikedIds(prev => { const n = new Set(prev); n.has(msg.id) ? n.delete(msg.id) : n.add(msg.id); return n })
                        setDislikedIds(prev => { const n = new Set(prev); n.delete(msg.id); return n })
                      }}
                      className={cn('p-1 rounded cursor-pointer transition-colors', likedIds.has(msg.id) ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500')}
                      aria-label="Helpful"
                    ><ThumbsUp size={12} /></button>
                    <button
                      onClick={() => {
                        setDislikedIds(prev => { const n = new Set(prev); n.has(msg.id) ? n.delete(msg.id) : n.add(msg.id); return n })
                        setLikedIds(prev => { const n = new Set(prev); n.delete(msg.id); return n })
                      }}
                      className={cn('p-1 rounded cursor-pointer transition-colors', dislikedIds.has(msg.id) ? 'text-red-400' : 'text-slate-300 hover:text-slate-500')}
                      aria-label="Not helpful"
                    ><ThumbsDown size={12} /></button>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="p-1 rounded text-slate-300 hover:text-slate-500 cursor-pointer"
                      aria-label="Copy message"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts (shown at start) */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.prompt)}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-brand-teal/30 hover:bg-brand-aqua/10 transition-all text-left cursor-pointer group"
              >
                <p.icon size={14} className="text-brand-teal flex-shrink-0" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-end gap-3 bg-white/80 rounded-2xl border border-brand-teal/20 p-3 focus-within:border-brand-teal/50 focus-within:shadow-[0_0_0_3px_rgba(100,182,172,0.1)] transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your career, interviews, salary, skills..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none min-h-[20px] max-h-[120px] leading-relaxed"
              rows={1}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="flex-shrink-0 rounded-xl"
            >
              <Send size={15} />
            </Button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Omnify AI can make mistakes. Verify important career decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
