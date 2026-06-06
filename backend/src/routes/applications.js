const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Application = require('../models/Application')
const { notify } = require('../utils/notify')

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Too many AI requests, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Get all applications ─────────────────────────────────────
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100)
  const filter = { userId: req.user._id }
  if (status && status !== 'all') filter.status = status

  const total = await Application.countDocuments(filter)
  const applications = await Application.find(filter)
    .populate('jobId')
    .populate('resumeId', 'fileName')
    .sort({ updatedAt: -1 })
    .skip((Number(page) - 1) * safeLimit)
    .limit(safeLimit)

  res.json({
    success: true,
    data: applications,
    pagination: { page: Number(page), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
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

// ─── Weekly activity — last 7 days ────────────────────────────
router.get('/weekly-activity', protect, asyncHandler(async (req, res) => {
  const userId = req.user._id
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const results = []

  for (let i = 6; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - i)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)

    const [applied, responses, interviews] = await Promise.all([
      Application.countDocuments({ userId, appliedAt: { $gte: start, $lte: end } }),
      Application.countDocuments({ userId, updatedAt: { $gte: start, $lte: end }, status: { $in: ['reviewing', 'phone_screen', 'offer', 'rejected'] } }),
      Application.countDocuments({ userId, updatedAt: { $gte: start, $lte: end }, status: { $in: ['interview', 'technical', 'final_interview'] } }),
    ])

    results.push({ day: DAY_NAMES[start.getDay()], applied, responses, interviews })
  }

  res.json({ success: true, data: results })
}))

// ─── Get application by ID ────────────────────────────────────
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('jobId')
    .populate('resumeId', 'fileName')
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })
  res.json({ success: true, data: application })
}))

// ─── Create application ───────────────────────────────────────
router.post('/', protect, asyncHandler(async (req, res) => {
  const { jobId, resumeId, coverLetter, notes } = req.body

  const Job = require('../models/Job')
  const job = await Job.findById(jobId)
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

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
  const VALID_STATUSES = ['saved', 'applied', 'pending', 'reviewing', 'phone_screen', 'interview', 'technical', 'final_interview', 'offer', 'accepted', 'rejected', 'withdrawn']
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` })
  if (note && note.length > 1000) return res.status(400).json({ success: false, message: 'note must be 1000 characters or fewer' })

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

  const VALID_TYPES = ['phone', 'video', 'onsite', 'technical', 'panel']
  const { type, scheduledAt, duration, location, meetingLink, interviewer, notes } = req.body
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` })
  if (duration !== undefined && (typeof duration !== 'number' || isNaN(duration) || duration < 0 || duration > 480)) return res.status(400).json({ success: false, message: 'duration must be a number between 0 and 480 minutes' })
  if (location && location.length > 500) return res.status(400).json({ success: false, message: 'location must be 500 characters or fewer' })
  if (meetingLink && meetingLink.length > 2000) return res.status(400).json({ success: false, message: 'meetingLink must be 2000 characters or fewer' })
  if (interviewer && interviewer.length > 200) return res.status(400).json({ success: false, message: 'interviewer must be 200 characters or fewer' })
  if (notes && notes.length > 5000) return res.status(400).json({ success: false, message: 'notes must be 5000 characters or fewer' })

  application.interviews.push({ type, scheduledAt, duration, location, meetingLink, interviewer, notes })
  application.status = 'interview'
  application.timeline.push({ status: 'interview', note: `${type} interview scheduled` })
  await application.save()

  const interviewDate = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'soon'
  notify({
    userId: req.user._id,
    type: 'interview_reminder',
    title: 'Interview scheduled',
    message: `A ${type} interview has been scheduled for ${interviewDate}.`,
    actionUrl: '/applications',
    metadata: { scheduledAt, type },
  })

  res.json({ success: true, data: application })
}))

// ─── Add note ─────────────────────────────────────────────────
router.post('/:id/notes', protect, asyncHandler(async (req, res) => {
  const { note } = req.body
  if (!note?.trim()) return res.status(400).json({ success: false, message: 'note is required' })
  if (note.length > 5000) return res.status(400).json({ success: false, message: 'note must be 5000 characters or fewer' })

  const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' })

  const current = application.notes || ''
  const appended = current ? `${current}\n\n${note.trim()}` : note.trim()
  if (appended.length > 50000) return res.status(400).json({ success: false, message: 'Total notes cannot exceed 50000 characters' })
  application.notes = appended
  await application.save()

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
  if (company.length > 200) return res.status(400).json({ success: false, message: 'company must be 200 characters or fewer' })
  if (title.length > 200) return res.status(400).json({ success: false, message: 'title must be 200 characters or fewer' })
  if (url && url.length > 2000) return res.status(400).json({ success: false, message: 'url must be 2000 characters or fewer' })
  if (notes && notes.length > 5000) return res.status(400).json({ success: false, message: 'notes must be 5000 characters or fewer' })
  const VALID_STATUSES = ['saved', 'applied', 'pending', 'reviewing', 'phone_screen', 'interview', 'technical', 'final_interview', 'offer', 'accepted', 'rejected', 'withdrawn']
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` })
  if (appliedAt && isNaN(new Date(appliedAt).getTime())) return res.status(400).json({ success: false, message: 'appliedAt must be a valid date' })

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
router.post('/auto-apply', protect, aiLimiter, asyncHandler(async (req, res) => {
  const { jobId, resumeId, coverLetter, customAnswers } = req.body
  if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' })

  if (customAnswers !== undefined) {
    if (typeof customAnswers !== 'object' || Array.isArray(customAnswers)) {
      return res.status(400).json({ success: false, message: 'customAnswers must be an object' })
    }
    const keys = Object.keys(customAnswers)
    if (keys.length > 50) return res.status(400).json({ success: false, message: 'customAnswers must have 50 entries or fewer' })
    for (const k of keys) {
      if (!/^[\w-]{1,100}$/.test(k)) return res.status(400).json({ success: false, message: `customAnswers key "${k}" contains invalid characters` })
      if (typeof customAnswers[k] !== 'string' || customAnswers[k].length > 1000) return res.status(400).json({ success: false, message: `customAnswers value for "${k}" must be a string of 1000 characters or fewer` })
    }
  }

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
  let resume
  if (resumeId) {
    resume = await Resume.findOne({ _id: resumeId, userId: req.user._id })
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
  } else {
    resume = (await Resume.findOne({ userId: req.user._id, isDefault: true })) ||
      (await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 }))
  }

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
