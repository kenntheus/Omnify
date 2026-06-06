const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')

router.use(protect, authorize('admin'))

router.get('/stats', asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, totalApplications, totalJobs] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Application.countDocuments(),
    Job.countDocuments({ isActive: true }),
  ])
  res.json({ success: true, data: { totalUsers, activeUsers, totalApplications, totalJobs } })
}))

router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100)
  const filter = {}
  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }]
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * safeLimit).limit(safeLimit)
  const total = await User.countDocuments(filter)
  res.json({ success: true, data: users, pagination: { total, page: Number(page), limit: safeLimit, pages: Math.ceil(total / safeLimit) } })
}))

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, data: user })
}))

router.put('/users/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'role', 'subscription', 'isActive']
  const updates = {}
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, data: user })
}))

router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot delete your own account' })
  await User.findByIdAndDelete(req.params.id)
  res.json({ success: true, message: 'User deleted' })
}))

router.get('/health', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { api: 'healthy', database: 'healthy', uptime: process.uptime() } })
}))

// ─── Recent activity logs ─────────────────────────────────────
router.get('/logs', asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 200)

  const [recentUsers, recentApps] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(safeLimit).select('name email createdAt').lean(),
    Application.find().sort({ updatedAt: -1 }).limit(safeLimit)
      .populate('userId', 'name email')
      .populate('jobId', 'title')
      .lean(),
  ])

  const logs = [
    ...recentUsers.map(u => ({
      type: 'auth',
      action: 'user_registered',
      user: u.name,
      email: u.email,
      timestamp: u.createdAt,
    })),
    ...recentApps.map(a => ({
      type: 'application',
      action: `application_${a.status}`,
      user: a.userId?.name || 'Unknown',
      email: a.userId?.email || '',
      details: a.jobId?.title || 'Unknown job',
      timestamp: a.updatedAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, safeLimit)

  res.json({ success: true, data: logs })
}))

// ─── Platform growth — last 6 months ─────────────────────────
router.get('/growth', asyncHandler(async (req, res) => {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const results = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

    const [users, apps] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: end } }),
      Application.countDocuments({ appliedAt: { $gte: start, $lte: end } }),
    ])

    results.push({ month: MONTH_NAMES[d.getMonth()], users, apps })
  }

  res.json({ success: true, data: results })
}))

// ─── Top skills in demand from job listings ───────────────────
router.get('/top-skills', asyncHandler(async (req, res) => {
  const jobs = await Job.find({ isActive: true }).select('skills').limit(500).lean()
  const freq = {}
  jobs.forEach(j => (j.skills || []).forEach(s => { if (s) freq[s] = (freq[s] || 0) + 1 }))
  const data = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }))
  res.json({ success: true, data })
}))

// ─── Sync jobs from Remotive API ──────────────────────────────
router.post('/sync-jobs', asyncHandler(async (req, res) => {
  const axios = require('axios')

  function stripHtml(html = '') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
  }

  const CATEGORIES = ['software-dev', 'devops-sysadmin', 'design', 'product', 'data']
  let all = []
  const errors = []

  for (const cat of CATEGORIES) {
    try {
      const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
        params: { category: cat, limit: 25 },
        timeout: 12000,
      })
      all = all.concat(data.jobs || [])
    } catch (err) {
      errors.push(`${cat}: ${err.message}`)
    }
  }

  let upserted = 0
  for (const job of all) {
    // Skip records missing required fields
    if (!job.id || typeof job.title !== 'string' || !job.title.trim() || typeof job.company_name !== 'string' || !job.company_name.trim()) continue
    try {
      await Job.findOneAndUpdate(
        { sourceId: `remotive-${job.id}` },
        {
          title: job.title.trim().substring(0, 200),
          company: { name: job.company_name.trim().substring(0, 200), logo: typeof job.company_logo === 'string' ? job.company_logo.substring(0, 500) : undefined, industry: job.category },
          location: (job.candidate_required_location || 'Worldwide').substring(0, 200),
          remote: 'remote',
          description: stripHtml(job.description),
          skills: (job.tags || []).filter(t => typeof t === 'string').slice(0, 10).map(t => t.substring(0, 100)),
          tags: (job.tags || []).filter(t => typeof t === 'string').slice(0, 10).map(t => t.substring(0, 100)),
          type: { full_time: 'full-time', part_time: 'part-time', contract: 'contract', freelance: 'freelance' }[job.job_type] || 'full-time',
          source: 'scraped',
          sourceUrl: typeof job.url === 'string' ? job.url.substring(0, 2000) : null,
          sourceId: `remotive-${job.id}`,
          postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
          isActive: true,
          experience: 'Not specified',
        },
        { upsert: true, new: true, runValidators: true }
      )
      upserted++
    } catch {
      // skip jobs that still fail validation
    }
  }

  res.json({
    success: true,
    message: `Synced ${upserted} jobs from Remotive`,
    data: { upserted, fetched: all.length, errors },
  })
}))

module.exports = router
