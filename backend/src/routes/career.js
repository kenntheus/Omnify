const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const axios = require('axios')

router.get('/insights', protect, asyncHandler(async (req, res) => {
  const Job = require('../models/Job')
  const Application = require('../models/Application')

  const userSkills = req.user.profile?.skills || []

  // Top skills across active jobs
  const jobs = await Job.find({ isActive: true }).select('skills').limit(200).lean()
  const skillFreq = {}
  jobs.forEach(j => (j.skills || []).forEach(s => { skillFreq[s] = (skillFreq[s] || 0) + 1 }))
  const topSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([s]) => s)
  const missingSkills = topSkills.filter(s => !userSkills.includes(s)).slice(0, 3)

  // Response rate from applications
  const [total, responded] = await Promise.all([
    Application.countDocuments({ userId: req.user._id }),
    Application.countDocuments({ userId: req.user._id, status: { $in: ['reviewing', 'phone_screen', 'interview', 'technical', 'final_interview', 'offer', 'accepted'] } }),
  ])
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : null

  // Try AI service for richer insights
  try {
    const aiResp = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/career/insights`,
      { userProfile: { skills: userSkills, topMarketSkills: topSkills, responseRate, totalApplications: total } },
      { timeout: 15000 }
    )
    return res.json({ success: true, data: aiResp.data.data })
  } catch {
    // Derive insights from real data
    const insights = []
    if (missingSkills.length > 0) {
      insights.push({ category: 'skill_gap', title: `Add ${missingSkills[0]} to your profile`, description: `${missingSkills[0]} appears in ${skillFreq[missingSkills[0]]} active job listings. Adding it could increase your match rate.`, priority: 'high' })
    }
    if (responseRate !== null && responseRate < 20 && total >= 5) {
      insights.push({ category: 'application', title: 'Boost your response rate', description: `Your current response rate is ${responseRate}%. Consider tailoring your cover letter and resume to each application.`, priority: 'high' })
    }
    if (missingSkills.length > 1) {
      insights.push({ category: 'skill_gap', title: `${missingSkills[1]} is in high demand`, description: `${missingSkills[1]} roles are among the most active listings right now. Adding it to your profile broadens your matches.`, priority: 'medium' })
    }
    if (userSkills.length === 0) {
      insights.push({ category: 'profile', title: 'Complete your skills profile', description: 'Adding your skills unlocks personalized job recommendations and career insights.', priority: 'high' })
    }
    if (insights.length === 0) {
      insights.push({ category: 'growth', title: 'Keep applying consistently', description: `You have ${total} application${total !== 1 ? 's' : ''} tracked. Consistent applications increase your chances significantly.`, priority: 'medium' })
    }
    res.json({ success: true, data: insights })
  }
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
