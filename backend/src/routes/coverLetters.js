const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const axios = require('axios')

const CoverLetter = require('../models/CoverLetter')

router.post('/generate', protect, asyncHandler(async (req, res) => {
  const { jobId, resumeId, tone = 'professional' } = req.body

  try {
    const aiResp = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/generate-cover-letter`,
      { jobId, resumeId, tone, userId: req.user._id },
      { timeout: 30000 }
    )
    const cover = await CoverLetter.create({
      userId: req.user._id,
      jobId,
      content: aiResp.data.content,
      tone,
      used: false,
      edited: false,
    })
    res.status(201).json({ success: true, data: cover })
  } catch {
    // Fallback mock cover letter
    const mockContent = `Dear Hiring Manager,

I am writing to express my strong interest in the [Position] role at [Company]. With ${req.user.profile?.experience?.length || 5}+ years of experience in software engineering and a deep expertise in ${req.user.profile?.skills?.slice(0, 3).join(', ') || 'React, TypeScript, and Node.js'}, I am confident that I would be a valuable addition to your team.

Throughout my career, I have consistently delivered high-quality software solutions that drive business value. My experience includes building scalable web applications, leading engineering teams, and collaborating cross-functionally to deliver products that users love.

What excites me most about [Company] is your commitment to [Company's mission]. I believe my background aligns perfectly with your team's needs, and I am eager to contribute to your continued growth and success.

I would welcome the opportunity to discuss how my skills and experience can benefit [Company]. Thank you for considering my application.

Best regards,
${req.user.name}`

    const cover = await CoverLetter.create({
      userId: req.user._id,
      jobId,
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

router.put('/:id', protect, asyncHandler(async (req, res) => {
  const cover = await CoverLetter.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { content: req.body.content, edited: true },
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
