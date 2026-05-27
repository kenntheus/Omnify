'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, Check, Zap, Brain, FileText,
  Briefcase, ClipboardList, Bot, Shield, TrendingUp,
  ChevronDown, Play, Menu, X
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ─── Data ─────────────────────────────────────────────────────
const features = [
  {
    icon: Brain, title: 'AI Resume Analyzer', color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50', textColor: 'text-violet-600',
    desc: 'Upload your resume and get instant ATS compatibility scores, skill extraction, and personalized improvement suggestions powered by AI.',
    points: ['ATS compatibility scoring', 'Skill gap analysis', 'Actionable improvement tips', 'Keyword optimization'],
  },
  {
    icon: Zap, title: 'One-Click Auto Apply', color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50', textColor: 'text-amber-600',
    desc: 'Let Omnify fill out and submit job applications on your behalf using intelligent browser automation — all in the background.',
    points: ['Automated form filling', 'Custom answer saving', 'Application history', 'Multi-platform support'],
  },
  {
    icon: Sparkles, title: 'AI Job Matching', color: 'from-brand-teal to-primary-400',
    bg: 'bg-brand-aqua/40', textColor: 'text-brand-teal',
    desc: 'Get personalized job recommendations ranked by compatibility score. Our AI analyzes your skills, experience, and preferences.',
    points: ['Compatibility scoring', 'Personalized recommendations', 'Skill-based matching', 'Salary insights'],
  },
  {
    icon: FileText, title: 'Cover Letter Generator', color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50', textColor: 'text-blue-600',
    desc: 'Generate tailored, professional cover letters for each application in seconds. Edit and personalize before sending.',
    points: ['Job-specific content', 'Multiple tone options', 'Editable output', 'One-click generation'],
  },
  {
    icon: ClipboardList, title: 'Application Tracker', color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50', textColor: 'text-emerald-600',
    desc: 'Track every application from submission to offer. Get reminders for follow-ups and interview prep.',
    points: ['Real-time status updates', 'Interview reminders', 'Timeline view', 'Analytics dashboard'],
  },
  {
    icon: Bot, title: 'AI Career Assistant', color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50', textColor: 'text-pink-600',
    desc: 'Chat with your AI career co-pilot for interview prep, salary negotiation tips, and personalized career growth advice.',
    points: ['Interview coaching', 'Salary estimation', 'Career path planning', 'Skill recommendations'],
  },
]

const faqs = [
  { q: 'Is Omnify safe to use for auto-applying?', a: 'Yes. Omnify uses read-only browser automation that mimics human behavior. We never store your passwords and use secure OAuth where possible.' },
  { q: 'How accurate is the AI job matching?', a: 'Our matching engine analyzes skill overlap, years of experience, and market demand to surface the most relevant roles for your profile.' },
  { q: 'Can I use Omnify for international jobs?', a: 'Absolutely. Omnify supports job boards across 40+ countries including LinkedIn, Indeed, Glassdoor, and many regional platforms.' },
  { q: 'What happens to my resume data?', a: 'Your data is encrypted at rest and in transit. We never share your personal information with third parties. You can delete your data at any time.' },
]

// ─── Components ───────────────────────────────────────────────
function FloatingCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn('glass-card p-4 shadow-glass-md', className)}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 400], [0, -60])

  return (
    <div className="min-h-dvh bg-brand-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-glass border-b border-slate-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Omnify</span>
            <span className="hidden sm:block text-xs font-semibold text-brand-teal bg-brand-aqua/50 border border-brand-teal/20 px-2 py-0.5 rounded-full">Beta</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {['Features', 'How it works', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" rightIcon={<ArrowRight size={14} />}>Get started</Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-glass"
            >
              <div className="px-4 py-4 space-y-3">
                {['Features', 'How it works', 'FAQ'].map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-2">
                    {item}
                  </a>
                ))}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <Link href="/login"><Button variant="secondary" fullWidth>Sign in</Button></Link>
                  <Link href="/register"><Button fullWidth>Get started</Button></Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-dvh flex items-center pt-16 overflow-hidden bg-gradient-hero">
        {/* Background blobs */}
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-40 w-[500px] h-[500px] bg-brand-aqua/20 rounded-full blur-3xl" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-aqua/60 border border-brand-teal/20 text-sm font-medium text-brand-teal mb-6"
            >
              <Sparkles size={14} />
              AI-Powered Career Platform
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-display-xl font-bold text-slate-800 leading-tight tracking-tight"
            >
              Land your{' '}
              <span className="gradient-text">dream job</span>
              <br />10x faster
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-slate-500 mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Omnify is your AI-powered career co-pilot. Optimize your resume, match with perfect jobs, auto-fill applications, and track your journey — all in one intelligent platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start"
            >
              <Link href="/register">
                <Button size="xl" rightIcon={<ArrowRight size={18} />}>
                  Get started
                </Button>
              </Link>
              <Button variant="secondary" size="xl" leftIcon={<Play size={16} />}>
                Watch demo
              </Button>
            </motion.div>

          </div>

          {/* Right — hero UI mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Main dashboard card */}
            <div className="glass-card p-6 shadow-glass-lg relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-bold text-slate-800">Your Job Dashboard</p>
                  <p className="text-xs text-slate-400">12 new matches today</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  AI Active
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Applied', value: '47', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Interviews', value: '5', color: 'text-brand-teal', bg: 'bg-brand-aqua/40' },
                  { label: 'Responses', value: '32%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(s => (
                  <div key={s.label} className={cn('rounded-xl p-3 text-center', s.bg)}>
                    <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Job match items */}
              <div className="space-y-2.5">
                {[
                  { company: 'Stripe', role: 'Senior Engineer', match: 96, logo: 'S', color: 'from-violet-500 to-purple-600' },
                  { company: 'Vercel', role: 'Frontend Dev', match: 92, logo: '▲', color: 'from-slate-700 to-slate-900' },
                  { company: 'Linear', role: 'Full Stack', match: 88, logo: 'L', color: 'from-indigo-500 to-blue-600' },
                ].map((job, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/60 transition-colors">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${job.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{job.role}</p>
                      <p className="text-xs text-slate-500">{job.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{job.match}%</span>
                      <button className="text-xs text-white bg-gradient-to-r from-brand-teal to-primary-400 px-2.5 py-1 rounded-lg font-medium hover:shadow-brand transition-shadow cursor-pointer">
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating cards */}
            <FloatingCard
              className="absolute -top-6 -left-8 w-52 z-20"
              delay={0.6}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Applied! 🎉</p>
                  <p className="text-xs text-slate-500">Senior Eng @ Stripe</p>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard
              className="absolute -bottom-4 -right-8 w-48 z-20"
              delay={0.8}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Brain size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Resume Score</p>
                  <p className="text-xs text-emerald-600 font-semibold">87/100 ↑ ATS Ready</p>
                </div>
              </div>
            </FloatingCard>

          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs text-slate-400">Scroll to explore</span>
          <ChevronDown size={16} className="text-slate-300" />
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-aqua/60 border border-brand-teal/20 text-sm font-medium text-brand-teal mb-4">
              <Sparkles size={13} /> All-in-one platform
            </span>
            <h2 className="text-4xl font-bold text-slate-800 mt-2">Everything you need to get hired</h2>
            <p className="text-lg text-slate-500 mt-3 max-w-2xl mx-auto">
              Omnify combines the power of AI with intelligent automation to give you an unfair advantage in your job search.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card p-6 cursor-default group"
              >
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110', feature.bg)}>
                  <feature.icon size={22} className={feature.textColor} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{feature.desc}</p>
                <ul className="space-y-1.5">
                  {feature.points.map(point => (
                    <li key={point} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-teal to-primary-400 flex items-center justify-center flex-shrink-0">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </div>
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-800">Get hired in 4 simple steps</h2>
            <p className="text-lg text-slate-500 mt-3">Set up once, let AI work for you 24/7</p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-0.5 bg-gradient-to-b from-brand-teal/30 via-brand-teal to-brand-teal/30" />

            <div className="space-y-8">
              {[
                { step: '01', title: 'Upload your resume', desc: 'Our AI analyzes your resume in seconds, extracts your skills, and gives you an ATS compatibility score with improvement tips.', icon: FileText, side: 'left' },
                { step: '02', title: 'Discover matched jobs', desc: 'Browse hundreds of AI-curated job recommendations ranked by your match score, salary, and preferences.', icon: Briefcase, side: 'right' },
                { step: '03', title: 'Auto-apply with one click', desc: 'Our browser automation fills out and submits applications on your behalf while you sleep. Customize responses once, apply everywhere.', icon: Zap, side: 'left' },
                { step: '04', title: 'Track and get hired', desc: 'Monitor all applications in real-time, get interview reminders, and use our AI coach to ace every interview.', icon: TrendingUp, side: 'right' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: item.side === 'left' ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'flex items-center gap-8 flex-col',
                    item.side === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  )}
                >
                  <div className={cn('flex-1', item.side === 'right' ? 'lg:text-right' : 'lg:text-left', 'text-center')}>
                    <span className="text-5xl font-black text-brand-teal/15">{item.step}</span>
                    <h3 className="text-xl font-bold text-slate-800 -mt-3">{item.title}</h3>
                    <p className={cn('text-slate-500 mt-2 max-w-xs mx-auto lg:mx-0', item.side === 'right' ? 'lg:ml-auto' : '')}>{item.desc}</p>
                  </div>

                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center shadow-brand flex-shrink-0 lg:mx-0">
                    <item.icon size={26} className="text-white" />
                  </div>

                  <div className="flex-1 lg:block hidden" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-mesh">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800">Frequently asked questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</span>
                  <ChevronDown size={16} className={cn('text-slate-400 transition-transform flex-shrink-0', activeFaq === i && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-brand-slate via-primary-600 to-brand-teal relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-glass">
              <Sparkles size={30} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to transform your job search?</h2>
            <p className="text-white/80 text-lg mb-8">Start using Omnify today and let AI handle the heavy lifting in your job search.</p>
            <Link href="/register">
              <Button
                size="xl"
                className="bg-white text-brand-teal hover:bg-white/90 font-bold shadow-glass-md"
                rightIcon={<ArrowRight size={18} />}
              >
                Get started
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-primary-500 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">Omnify</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">Your AI-powered career co-pilot. Land your dream job 10x faster with intelligent automation.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Changelog', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Security'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-white mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs">© 2025 Omnify. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Shield size={12} />
              <span className="text-xs">SOC 2 Type II · GDPR Compliant · 256-bit encryption</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
