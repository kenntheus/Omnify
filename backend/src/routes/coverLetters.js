const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const axios = require('axios')

const CoverLetter = require('../models/CoverLetter')

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Too many AI requests, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/generate', protect, aiLimiter, asyncHandler(async (req, res) => {
  // jobId + resumeId for AI-linked generation; title + company for free-text flow
  const { jobId, resumeId, tone = 'professional', title, company } = req.body
  const VALID_TONES = ['professional', 'enthusiastic', 'formal', 'creative']
  if (!VALID_TONES.includes(tone)) return res.status(400).json({ success: false, message: `tone must be one of: ${VALID_TONES.join(', ')}` })

  // Verify the resume belongs to the requesting user
  if (resumeId) {
    const Resume = require('../models/Resume')
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id })
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
  }

  // Resolve display values for the fallback template
  let jobTitle = title || '[Position]'
  let companyName = company || '[Company]'
  if (jobId) {
    try {
      const Job = require('../models/Job')
      const job = await Job.findById(jobId).select('title company')
      if (job) {
        jobTitle = job.title
        companyName = job.company?.name || companyName
      }
    } catch { /* ignore */ }
  }

  try {
    const aiResp = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/generate-cover-letter`,
      { jobId, resumeId, tone, userId: req.user._id, title: jobTitle, company: companyName },
      { timeout: 30000 }
    )
    const cover = await CoverLetter.create({
      userId: req.user._id,
      jobId: jobId || undefined,
      content: aiResp.data.content,
      tone,
      used: false,
      edited: false,
    })
    res.status(201).json({ success: true, data: cover })
  } catch {
    const skills = req.user.profile?.skills?.slice(0, 3).join(', ') || 'React, TypeScript, and Node.js'
    const years = req.user.profile?.experience?.length || 5
    const mockContent = `Dear ${companyName} Hiring Team,

I am writing to express my strong interest in the ${jobTitle} role at ${companyName}. With ${years}+ years of experience in software engineering and deep expertise in ${skills}, I am confident I would be a valuable addition to your team.

Throughout my career I have consistently delivered high-quality software solutions that drive business value — building scalable web applications, leading cross-functional initiatives, and shipping products that users love.

What excites me most about ${companyName} is the opportunity to work on meaningful challenges at scale. I believe my background aligns closely with your team's needs and I would welcome the chance to contribute to your continued growth.

Thank you for considering my application. I look forward to speaking with you.

Best regards,
${req.user.name}`

    const cover = await CoverLetter.create({
      userId: req.user._id,
      jobId: jobId || undefined,
      content: mockContent,
      tone,
      used: false,
      edited: false,
    })
    res.status(201).json({ success: true, data: cover })
  }
}))

router.get('/', protect, asyncHandler(async (req, res) => {
  const covers = await CoverLetter.find({ userId: req.user._id }).populate('jobId', 'title company').sort({ createdAt: -1 })
  res.json({ success: true, data: covers })
}))

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const cover = await CoverLetter.findOne({ _id: req.params.id, userId: req.user._id }).populate('jobId', 'title company')
  if (!cover) return res.status(404).json({ success: false, message: 'Cover letter not found' })
  res.json({ success: true, data: cover })
}))

router.put('/:id', protect, asyncHandler(async (req, res) => {
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'content is required' })
  if (content.length > 10000) return res.status(400).json({ success: false, message: 'content must be 10000 characters or fewer' })

  const cover = await CoverLetter.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { content, edited: true },
    { new: true }
  )
  if (!cover) return res.status(404).json({ success: false, message: 'Cover letter not found' })
  res.json({ success: true, data: cover })
}))

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await CoverLetter.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  res.json({ success: true, message: 'Cover letter deleted' })
}))

module.exports = router
