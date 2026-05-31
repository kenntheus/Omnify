const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Application = require('../models/Application')
const { notify } = require('../utils/notify')

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

  notify({
    userId: req.user._id,
    type: 'application_update',
    title: 'Application submitted',
    message: `Your application has been submitted and is being tracked.`,
    actionUrl: '/applications',
  })

  res.status(201).json({ success: true, data: application, message: 'Application submitted' })
}))

// ─── Update status ────────────────────────────────────────────
router.put('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status, note } = req.body

  const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })

  const prevStatus = application.status
  application.status = status
  application.timeline.push({ status, note, automated: false })
  await application.save()

  // Notify on meaningful status changes
  const notifyStatuses = {
    reviewing: 'Application under review',
    phone_screen: 'Phone screen scheduled',
    interview: 'Interview stage reached',
    technical: 'Technical interview stage',
    final_interview: 'Final interview stage',
    offer: 'Offer received!',
    accepted: 'Offer accepted — congratulations!',
    rejected: 'Application update',
  }
  const notifyTitle = notifyStatuses[status]
  if (notifyTitle && status !== prevStatus) {
    notify({
      userId: req.user._id,
      type: status === 'offer' || status === 'accepted' ? 'application_update' : 'application_update',
      title: notifyTitle,
      message: `Your application status has been updated to "${status.replace(/_/g, ' ')}".`,
      actionUrl: '/applications',
    })
  }

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

  const interviewDate = req.body.scheduledAt
    ? new Date(req.body.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'soon'
  notify({
    userId: req.user._id,
    type: 'interview_reminder',
    title: 'Interview scheduled',
    message: `A ${req.body.type} interview has been scheduled for ${interviewDate}.`,
    actionUrl: '/applications',
    metadata: { scheduledAt: req.body.scheduledAt, type: req.body.type },
  })

  res.json({ success: true, data: application })
}))

// ─── Delete application ───────────────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })
  res.json({ success: true, message: 'Application deleted' })
}))

// ─── Manual application entry (no job listing required) ──────
router.post('/manual', protect, asyncHandler(async (req, res) => {
  const { company, title, url, status = 'applied', appliedAt, notes } = req.body
  if (!company || !title) return res.status(400).json({ success: false, message: 'company and title are required' })

  const Job = require('../models/Job')

  const job = await Job.create({
    title,
    company: { name: company },
    location: 'Not specified',
    remote: 'onsite',
    description: `Manually tracked application for ${title} at ${company}`,
    skills: [],
    source: 'manual',
    sourceUrl: url || null,
    isActive: false,
    type: 'full-time',
    experience: 'Not specified',
  })

  const application = await Application.create({
    userId: req.user._id,
    jobId: job._id,
    status,
    appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
    notes,
    timeline: [{ status, automated: false }],
  })

  const populated = await Application.findById(application._id).populate('jobId')

  notify({
    userId: req.user._id,
    type: 'application_update',
    title: 'Application added',
    message: `Added manual application for ${title} at ${company}.`,
    actionUrl: '/applications',
  })

  res.status(201).json({ success: true, data: populated, message: 'Application added' })
}))

// ─── Auto-apply via AI browser automation ────────────────────
router.post('/auto-apply', protect, asyncHandler(async (req, res) => {
  const { jobId, resumeId, coverLetter, customAnswers } = req.body
  if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' })

  const Job = require('../models/Job')
  const Resume = require('../models/Resume')
  const axios = require('axios')

  const [job, existingApp] = await Promise.all([
    Job.findById(jobId),
    Application.findOne({ userId: req.user._id, jobId, status: { $ne: 'saved' } }),
  ])

  if (!job) return res.status(404).json({ success: false, message: 'Job not found' })
  if (existingApp) return res.status(400).json({ success: false, message: 'Already applied to this job' })
  if (!job.sourceUrl) return res.status(400).json({ success: false, message: 'No external application URL available for this job' })

  // Resolve resume: provided > default > most recent
  const resume = resumeId
    ? await Resume.findOne({ _id: resumeId, userId: req.user._id })
    : (await Resume.findOne({ userId: req.user._id, isDefault: true })) ||
      (await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 }))

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
  const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'

  const userData = {
    name: req.user.name,
    email: req.user.email,
    phone: req.user.profile?.phone || '',
    linkedin: req.user.profile?.linkedin || '',
    portfolio: req.user.profile?.portfolio || '',
  }

  let automationResult = { success: false, message: 'Automation service unavailable' }
  try {
    const aiResponse = await axios.post(
      `${aiUrl}/automation/apply`,
      {
        jobUrl: job.sourceUrl,
        userData,
        resumeUrl: resume ? `${backendUrl}${resume.fileUrl}` : null,
        coverLetter,
        customAnswers,
      },
      { timeout: 60000 }
    )
    automationResult = aiResponse.data.data || aiResponse.data
  } catch {
    // AI service down — still record the application
  }

  // Upgrade a 'saved' entry → 'applied', or create fresh
  const savedApp = await Application.findOne({ userId: req.user._id, jobId, status: 'saved' })
  let application

  if (savedApp) {
    savedApp.status = 'applied'
    savedApp.automatedApply = true
    savedApp.appliedAt = new Date()
    if (resume) savedApp.resumeId = resume._id
    if (coverLetter) savedApp.coverLetter = coverLetter
    savedApp.timeline.push({ status: 'applied', automated: true, note: 'Auto-applied via Omnify' })
    application = await savedApp.save()
  } else {
    application = await Application.create({
      userId: req.user._id,
      jobId,
      status: 'applied',
      automatedApply: true,
      appliedAt: new Date(),
      resumeId: resume?._id,
      coverLetter,
      customAnswers,
      timeline: [{ status: 'applied', automated: true, note: 'Auto-applied via Omnify' }],
    })
  }

  notify({
    userId: req.user._id,
    type: 'application_update',
    title: automationResult.success ? 'Auto-apply completed' : 'Application recorded',
    message: automationResult.success
      ? `Omnify automatically submitted your application to ${job.title} at ${job.company?.name || 'the company'}.`
      : `Your application to ${job.title} has been recorded. Complete the application manually if needed.`,
    actionUrl: '/applications',
  })

  res.status(201).json({
    success: true,
    message: automationResult.success ? 'Auto-apply completed successfully' : 'Application recorded (automation unavailable)',
    data: { application, automation: automationResult },
  })
}))

module.exports = router
