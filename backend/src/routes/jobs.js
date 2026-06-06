const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Job = require('../models/Job')
const Application = require('../models/Application')
const { notify } = require('../utils/notify')

// ─── Search jobs ──────────────────────────────────────────────
router.get('/search', protect, asyncHandler(async (req, res) => {
  const {
    query, location, remote, type, salary_min, salary_max,
    experience, page = 1, limit = 20,
  } = req.query

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100)

  const filter = { isActive: true }

  if (query) filter.$text = { $search: query }
  if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' }
  if (remote) filter.remote = remote
  if (type) filter.type = type
  if (salary_min || salary_max) {
    filter['salary.min'] = {}
    if (salary_min) filter['salary.min'].$gte = Number(salary_min)
    if (salary_max) filter['salary.max'] = { $lte: Number(salary_max) }
  }

  const skip = (Number(page) - 1) * safeLimit
  const total = await Job.countDocuments(filter)
  const jobs = await Job.find(filter)
    .sort({ postedAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .lean()

  // Mark applied/saved jobs
  const applications = await Application.find({ userId: req.user._id, jobId: { $in: jobs.map(j => j._id) } }).select('jobId status')
  const appMap = new Map(applications.map(a => [a.jobId.toString(), a.status]))

  const enriched = jobs.map(j => ({
    ...j,
    isApplied: appMap.has(j._id.toString()),
    applicationStatus: appMap.get(j._id.toString()),
  }))

  res.json({
    success: true,
    data: enriched,
    pagination: {
      page: Number(page),
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
      hasNext: skip + jobs.length < total,
      hasPrev: Number(page) > 1,
    },
  })
}))

// ─── Get AI-recommended jobs ──────────────────────────────────
router.get('/recommended', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50)
  const userSkills = req.user.profile?.skills || []

  const jobs = await Job.find({
    isActive: true,
    ...(userSkills.length > 0 && { skills: { $in: userSkills } }),
  })
    .sort({ postedAt: -1 })
    .limit(50)
    .lean()

  // Simple skill-based scoring
  const scored = jobs.map(job => {
    const matchedSkills = job.skills?.filter(s => userSkills.includes(s)) || []
    const matchScore = job.skills?.length > 0
      ? Math.round(60 + (matchedSkills.length / job.skills.length) * 40)
      : 60
    return { ...job, matchScore }
  }).sort((a, b) => b.matchScore - a.matchScore)

  const skip = (Number(page) - 1) * safeLimit
  const paginated = scored.slice(skip, skip + safeLimit)

  res.json({ success: true, data: paginated })
}))

// ─── Get saved jobs ───────────────────────────────────────────
// Must be before /:id to avoid Express matching 'saved' as an ID
router.get('/saved', protect, asyncHandler(async (req, res) => {
  const saved = await Application.find({ userId: req.user._id, status: 'saved' })
    .populate('jobId')
    .sort({ createdAt: -1 })
  res.json({ success: true, data: saved.map(s => ({ job: s.jobId, savedAt: s.createdAt })) })
}))

// ─── Get match score for a job ────────────────────────────────
router.get('/:id/match-score', protect, asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).lean()
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

  const userSkills = req.user.profile?.skills || []
  const matchedSkills = job.skills?.filter(s => userSkills.includes(s)) || []
  const matchScore = job.skills?.length > 0
    ? Math.round(60 + (matchedSkills.length / job.skills.length) * 40)
    : 60

  res.json({ success: true, data: { matchScore, matchedSkills } })
}))

// ─── Get job by ID ────────────────────────────────────────────
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' })
  res.json({ success: true, data: job })
}))

// ─── Save job ─────────────────────────────────────────────────
router.post('/:id/save', protect, asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

  const existing = await Application.findOne({ userId: req.user._id, jobId: job._id })
  if (existing) return res.status(400).json({ success: false, message: 'Job already saved' })

  const application = await Application.create({
    userId: req.user._id,
    jobId: job._id,
    status: 'saved',
    timeline: [{ status: 'saved', automated: false }],
  })

  // Notify when a high-match job is saved
  const userSkills = req.user.profile?.skills || []
  const matchedSkills = job.skills?.filter(s => userSkills.includes(s)) || []
  if (matchedSkills.length >= 2) {
    notify({
      userId: req.user._id,
      type: 'job_match',
      title: 'Strong job match saved',
      message: `You saved ${job.title} at ${job.company?.name || 'a company'} — ${matchedSkills.length} of your skills match this role.`,
      actionUrl: '/saved-jobs',
    })
  }

  res.status(201).json({ success: true, data: application, message: 'Job saved' })
}))

// ─── Unsave job ───────────────────────────────────────────────
router.delete('/:id/save', protect, asyncHandler(async (req, res) => {
  const deleted = await Application.findOneAndDelete({
    userId: req.user._id,
    jobId: req.params.id,
    status: 'saved',
  })
  if (!deleted) return res.status(404).json({ success: false, message: 'Saved job not found' })
  res.json({ success: true, message: 'Job removed from saved' })
}))

module.exports = router
