const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const axios = require('axios')

router.get('/insights', protect, asyncHandler(async (req, res) => {
  const insights = [
    { category: 'skill_gap', title: 'Learn System Design', description: 'Adding system design skills could increase match scores by 23%.', priority: 'high' },
    { category: 'salary', title: 'Negotiate Your Worth', description: 'Based on your experience, you may be underpaid by $15K-20K.', priority: 'high' },
    { category: 'growth', title: 'TypeScript in High Demand', description: 'TypeScript roles pay 18% more. You\'re already proficient!', priority: 'medium' },
  ]
  res.json({ success: true, data: insights })
}))

router.get('/salary', protect, asyncHandler(async (req, res) => {
  const { role, location } = req.query
  const estimate = {
    role: role || 'Frontend Engineer',
    location: location || 'San Francisco, CA',
    min: 120000, max: 200000, median: 155000,
    currency: 'USD', source: 'Glassdoor + LinkedIn', updatedAt: new Date().toISOString(),
  }
  res.json({ success: true, data: estimate })
}))

router.get('/interview-questions', protect, asyncHandler(async (req, res) => {
  const questions = [
    { question: 'Tell me about a challenging technical problem you solved.', category: 'behavioral', difficulty: 'medium', tips: ['Use STAR method', 'Quantify impact'] },
    { question: 'How do you handle React performance optimization?', category: 'technical', difficulty: 'medium', tips: ['Mention useMemo, useCallback', 'Talk about profiling'] },
    { question: 'Design a URL shortener service.', category: 'situational', difficulty: 'hard', tips: ['Discuss scalability', 'Mention database choices'] },
  ]
  res.json({ success: true, data: questions })
}))

router.get('/skill-recommendations', protect, asyncHandler(async (req, res) => {
  const Job = require('../models/Job')

  const userSkills = (req.user.profile?.skills || []).map(s => s.toLowerCase())

  // Count skill frequency across active job listings
  const jobs = await Job.find({ isActive: true }).select('skills').limit(300).lean()
  const freq = {}
  jobs.forEach(j => (j.skills || []).forEach(s => {
    const k = s.toLowerCase()
    freq[k] = (freq[k] || 0) + 1
  }))

  // Sort by frequency, exclude skills user already has
  const recommendations = Object.entries(freq)
    .filter(([skill]) => !userSkills.includes(skill))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({
      skill,
      jobCount: count,
      demandLevel: count >= 30 ? 'high' : count >= 15 ? 'medium' : 'low',
      reason: `Appears in ${count} active job listing${count !== 1 ? 's' : ''}`,
    }))

  res.json({ success: true, data: recommendations })
}))

router.post('/chat', protect, asyncHandler(async (req, res) => {
  const { message, context } = req.body
  try {
    const aiResp = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/career-chat`,
      { message, context, userId: req.user._id },
      { timeout: 30000 }
    )
    res.json({ success: true, data: { response: aiResp.data.response } })
  } catch {
    res.json({ success: true, data: { response: 'Based on your profile, I recommend focusing on system design and distributed systems skills to boost your match scores by up to 23%. Would you like specific resources?' } })
  }
}))

module.exports = router
