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
  const filter = {}
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
  const users = await User.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit))
  const total = await User.countDocuments(filter)
  res.json({ success: true, data: users, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } })
}))

router.put('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  res.json({ success: true, data: user })
}))

router.delete('/users/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
  res.json({ success: true, message: 'User deleted' })
}))

router.get('/health', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { api: 'healthy', database: 'healthy', uptime: process.uptime() } })
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
    try {
      await Job.findOneAndUpdate(
        { sourceId: `remotive-${job.id}` },
        {
          title: job.title,
          company: { name: job.company_name, logo: job.company_logo, industry: job.category },
          location: job.candidate_required_location || 'Worldwide',
          remote: 'remote',
          description: stripHtml(job.description),
          skills: (job.tags || []).slice(0, 10),
          tags: (job.tags || []).slice(0, 10),
          type: { full_time: 'full-time', part_time: 'part-time', contract: 'contract', freelance: 'freelance' }[job.job_type] || 'full-time',
          source: 'scraped',
          sourceUrl: job.url,
          sourceId: `remotive-${job.id}`,
          postedAt: new Date(job.publication_date),
          isActive: true,
          experience: 'Not specified',
        },
        { upsert: true, new: true, runValidators: false }
      )
      upserted++
    } catch {
      // skip invalid jobs
    }
  }

  res.json({
    success: true,
    message: `Synced ${upserted} jobs from Remotive`,
    data: { upserted, fetched: all.length, errors },
  })
}))

module.exports = router
