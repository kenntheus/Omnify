const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Application = require('../models/Application')

// ─── Get all applications ─────────────────────────────────────
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = { userId: req.user._id }
  if (status && status !== 'all') filter.status = status

  const total = await Application.countDocuments(filter)
  const applications = await Application.find(filter)
    .populate('jobId')
    .populate('resumeId', 'fileName')
    .sort({ updatedAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))

  res.json({
    success: true,
    data: applications,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  })
}))

// ─── Get application stats ────────────────────────────────────
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id
  const [statusCounts, total] = await Promise.all([
    Application.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ userId }),
  ])

  const stats = { total, applied: 0, pending: 0, interviews: 0, offers: 0, rejected: 0, responseRate: 0 }
  statusCounts.forEach(({ _id, count }) => {
    if (_id === 'applied') stats.applied = count
    if (['pending', 'reviewing'].includes(_id)) stats.pending += count
    if (['interview', 'phone_screen', 'technical', 'final_interview'].includes(_id)) stats.interviews += count
    if (['offer', 'accepted'].includes(_id)) stats.offers += count
    if (_id === 'rejected') stats.rejected = count
  })

  const responded = stats.interviews + stats.offers + stats.rejected
  stats.responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

  res.json({ success: true, data: stats })
}))

// ─── Create application ───────────────────────────────────────
router.post('/', protect, asyncHandler(async (req, res) => {
  const { jobId, resumeId, coverLetter, notes } = req.body

  const existing = await Application.findOne({ userId: req.user._id, jobId })
  if (existing) {
    if (existing.status === 'saved') {
      existing.status = 'applied'
      existing.appliedAt = new Date()
      existing.resumeId = resumeId
      existing.coverLetter = coverLetter
      existing.timeline.push({ status: 'applied', automated: false })
      await existing.save()
      return res.json({ success: true, data: existing, message: 'Application submitted' })
    }
    return res.status(400).json({ success: false, message: 'Already applied to this job' })
  }

  const application = await Application.create({
    userId: req.user._id,
    jobId,
    status: 'applied',
    appliedAt: new Date(),
    resumeId,
    coverLetter,
    notes,
    timeline: [{ status: 'applied', automated: false }],
  })

  res.status(201).json({ success: true, data: application, message: 'Application submitted' })
}))

// ─── Update status ────────────────────────────────────────────
router.put('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status, note } = req.body

  const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })

  application.status = status
  application.timeline.push({ status, note, automated: false })
  await application.save()

  res.json({ success: true, data: application })
}))

// ─── Add interview ────────────────────────────────────────────
router.post('/:id/interviews', protect, asyncHandler(async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })

  application.interviews.push(req.body)
  application.status = 'interview'
  application.timeline.push({ status: 'interview', note: `${req.body.type} interview scheduled` })
  await application.save()

  res.json({ success: true, data: application })
}))

// ─── Delete application ───────────────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })
  res.json({ success: true, message: 'Application deleted' })
}))

module.exports = router
