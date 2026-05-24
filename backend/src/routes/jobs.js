const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Job = require('../models/Job')
const Application = require('../models/Application')

// ─── Search jobs ──────────────────────────────────────────────
router.get('/search', protect, asyncHandler(async (req, res) => {
  const {
    query, location, remote, type, salary_min, salary_max,
    experience, page = 1, limit = 20,
  } = req.query

  const filter = { isActive: true }

  if (query) filter.$text = { $search: query }
  if (location) filter.location = { $regex: location, $options: 'i' }
  if (remote) filter.remote = remote
  if (type) filter.type = type
  if (salary_min || salary_max) {
    filter['salary.min'] = {}
    if (salary_min) filter['salary.min'].$gte = Number(salary_min)
    if (salary_max) filter['salary.max'] = { $lte: Number(salary_max) }
  }

  const skip = (Number(page) - 1) * Number(limit)
  const total = await Job.countDocuments(filter)
  const jobs = await Job.find(filter)
    .sort({ postedAt: -1 })
    .skip(skip)
    .limit(Number(limit))
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
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
      hasNext: skip + jobs.length < total,
      hasPrev: Number(page) > 1,
    },
  })
}))

// ─── Get AI-recommended jobs ──────────────────────────────────
router.get('/recommended', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query
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

  const skip = (Number(page) - 1) * Number(limit)
  const paginated = scored.slice(skip, skip + Number(limit))

  res.json({ success: true, data: paginated })
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

// ─── Get saved jobs ───────────────────────────────────────────
router.get('/saved', protect, asyncHandler(async (req, res) => {
  const saved = await Application.find({ userId: req.user._id, status: 'saved' })
    .populate('jobId')
    .sort({ createdAt: -1 })
  res.json({ success: true, data: saved.map(s => s.jobId) })
}))

module.exports = router
