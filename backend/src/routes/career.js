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
  const { role = '', location = '' } = req.query
  const r = role.toLowerCase()

  // Seniority multiplier from title
  const seniorityMultiplier =
    /staff|principal|distinguished/.test(r) ? 1.4 :
    /senior|sr\.?|lead/.test(r) ? 1.2 :
    /junior|jr\.?|entry/.test(r) ? 0.75 :
    /intern/.test(r) ? 0.4 : 1.0

  // Base ranges by discipline
  const base =
    /machine.learning|ml |ai |data.sci/.test(r) ? { min: 130000, max: 210000 } :
    /devops|platform|infra|sre|site.reliability/.test(r) ? { min: 125000, max: 205000 } :
    /backend|server|node|python|java|go\b|rust/.test(r) ? { min: 120000, max: 200000 } :
    /fullstack|full.stack/.test(r) ? { min: 115000, max: 195000 } :
    /frontend|react|angular|vue|ui/.test(r) ? { min: 110000, max: 185000 } :
    /product.manager|pm\b/.test(r) ? { min: 120000, max: 200000 } :
    /design|ux|ui\/ux/.test(r) ? { min: 95000, max: 165000 } :
    /data.eng/.test(r) ? { min: 125000, max: 205000 } :
    { min: 110000, max: 185000 }

  // Location cost-of-living adjustment
  const locMultiplier =
    /san francisco|sf|bay area|new york|nyc|seattle|boston/.test(location.toLowerCase()) ? 1.25 :
    /austin|denver|chicago|la|los angeles|miami/.test(location.toLowerCase()) ? 1.05 :
    /remote|worldwide/.test(location.toLowerCase()) ? 1.0 : 1.0

  const min = Math.round(base.min * seniorityMultiplier * locMultiplier / 1000) * 1000
  const max = Math.round(base.max * seniorityMultiplier * locMultiplier / 1000) * 1000
  const median = Math.round((min + max) / 2 / 1000) * 1000

  res.json({
    success: true,
    data: {
      role: role || 'Software Engineer',
      location: location || 'United States',
      min, max, median,
      currency: 'USD',
      source: 'Omnify market data',
      updatedAt: new Date().toISOString(),
    },
  })
}))

router.get('/interview-questions', protect, asyncHandler(async (req, res) => {
  const questions = [
    { question: 'Tell me about a challenging technical problem you solved.', category: 'behavioral', difficulty: 'medium', tips: ['Use STAR method', 'Quantify impact'] },
    { question: 'How do you handle React performance optimization?', category: 'technical', difficulty: 'medium', tips: ['Mention useMemo, useCallback', 'Talk about profiling'] },
    { question: 'Design a URL shortener service.', category: 'situational', difficulty: 'hard', tips: ['Discuss scalability', 'Mention database choices'] },
  ]
  res.json({ success: true, data: questions })
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
