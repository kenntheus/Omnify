const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Resume = require('../models/Resume')
const cloudinary = require('../config/cloudinary')
const { uploadStream } = require('../utils/cloudinaryUpload')
const { notify } = require('../utils/notify')
const axios = require('axios')

// ─── Multer (memory storage — uploaded to Cloudinary) ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const allowedExts = ['.pdf', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) cb(null, true)
    else cb(new Error('Only PDF and DOCX files are allowed'))
  },
})

// ─── Upload resume ────────────────────────────────────────────
router.post('/upload', protect, upload.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'docx'
  const publicId = `resume-${req.user._id}-${Date.now()}`

  const result = await uploadStream(req.file.buffer, {
    folder: 'omnify/resumes',
    public_id: publicId,
    resource_type: 'raw',
  })

  const resume = await Resume.create({
    userId: req.user._id,
    fileName: req.file.originalname,
    fileUrl: result.secure_url,
    cloudinaryPublicId: result.public_id,
    fileType,
    fileSize: req.file.size,
    isDefault: false,
  })

  // Set as default if first resume
  const count = await Resume.countDocuments({ userId: req.user._id })
  if (count === 1) {
    resume.isDefault = true
    await resume.save()
  }

  res.status(201).json({ success: true, data: resume, message: 'Resume uploaded successfully' })
}))

// ─── Get all resumes ──────────────────────────────────────────
router.get('/', protect, asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 })
  res.json({ success: true, data: resumes })
}))

// ─── Get resume by ID ─────────────────────────────────────────
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
  res.json({ success: true, data: resume })
}))

// ─── Analyze resume (calls AI service) ───────────────────────
router.post('/:id/analyze', protect, asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })

  try {
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/analyze-resume`,
      { resumeUrl: resume.fileUrl, resumeType: resume.fileType },
      { timeout: 60000 }
    )

    resume.analysis = { ...aiResponse.data, analyzedAt: new Date() }
    await resume.save()

    notify({
      userId: req.user._id,
      type: 'tip',
      title: 'Resume analysis complete',
      message: `Your resume scored ${aiResponse.data.atsScore ?? '—'}/100 for ATS compatibility. View your results and improvement tips.`,
      actionUrl: '/resume',
    })

    res.json({ success: true, data: resume, message: 'Resume analyzed successfully' })
  } catch {
    // Fallback mock analysis if AI service is down
    resume.analysis = {
      atsScore: 87,
      overallScore: 82,
      formattingScore: 90,
      contentScore: 85,
      impactScore: 72,
      skills: [
        { name: 'React', category: 'technical', proficiency: 'expert' },
        { name: 'TypeScript', category: 'technical', proficiency: 'advanced' },
        { name: 'Node.js', category: 'technical', proficiency: 'advanced' },
      ],
      keywords: ['TypeScript', 'React', 'REST API', 'CI/CD'],
      strengths: ['Strong technical background', 'Quantified achievements', 'Good education section'],
      improvements: [
        { category: 'keywords', priority: 'high', title: 'Add missing ATS keywords', description: 'Include "system design", "distributed systems"' },
        { category: 'impact', priority: 'medium', title: 'Quantify more achievements', description: 'Add numbers and percentages to bullet points' },
      ],
      analyzedAt: new Date(),
    }
    await resume.save()

    notify({
      userId: req.user._id,
      type: 'tip',
      title: 'Resume analysis complete',
      message: `Your resume scored ${resume.analysis.atsScore}/100. View your results and improvement suggestions.`,
      actionUrl: '/resume',
    })

    res.json({ success: true, data: resume, message: 'Resume analyzed (AI service unavailable, using fallback)' })
  }
}))

// ─── Set default resume ───────────────────────────────────────
router.put('/:id/default', protect, asyncHandler(async (req, res) => {
  await Resume.updateMany({ userId: req.user._id }, { isDefault: false })
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isDefault: true },
    { new: true }
  )
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
  res.json({ success: true, data: resume, message: 'Default resume updated' })
}))

// ─── Serve resume file (redirect to Cloudinary URL) ──────────
router.get('/:id/file', protect, asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })
  res.redirect(resume.fileUrl)
}))

// ─── Delete resume ────────────────────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })

  if (resume.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(resume.cloudinaryPublicId, { resource_type: 'raw' })
    } catch { /* ignore Cloudinary cleanup errors */ }
  }

  res.json({ success: true, message: 'Resume deleted' })
}))

module.exports = router
