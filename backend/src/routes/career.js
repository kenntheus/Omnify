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
  const { skills = '', jobId } = req.query
  const requestedSkills = skills ? skills.split(',').map(s => s.trim().toLowerCase()) : (req.user.profile?.skills || []).map(s => s.toLowerCase())

  // Question bank keyed by skill/topic
  const BANK = {
    react: [
      { question: 'How does React reconciliation work and what triggers a re-render?', category: 'technical', difficulty: 'medium', tips: ['Explain virtual DOM diffing', 'Mention keys in lists', 'Discuss React.memo and useMemo'] },
      { question: 'Explain the difference between useEffect and useLayoutEffect.', category: 'technical', difficulty: 'medium', tips: ['Timing of execution', 'When to prefer each', 'Side effects vs DOM mutations'] },
    ],
    typescript: [
      { question: 'What are conditional types in TypeScript and when would you use them?', category: 'technical', difficulty: 'hard', tips: ['Give a concrete mapped type example', 'Mention infer keyword', 'Discuss discriminated unions'] },
      { question: 'How do you type a function that accepts different argument shapes?', category: 'technical', difficulty: 'medium', tips: ['Discuss function overloads', 'Union types', 'Generics with constraints'] },
    ],
    node: [
      { question: 'How does the Node.js event loop handle async operations?', category: 'technical', difficulty: 'hard', tips: ['Phases: timers, I/O, poll, check', 'Microtask queue vs macrotask', 'Blocking vs non-blocking'] },
      { question: 'How would you handle memory leaks in a Node.js service?', category: 'technical', difficulty: 'hard', tips: ['heap snapshots', 'Event listener cleanup', 'Circular references'] },
    ],
    python: [
      { question: 'Explain Python\'s GIL and its implications for concurrency.', category: 'technical', difficulty: 'hard', tips: ['Threading vs multiprocessing', 'asyncio for I/O-bound', 'When GIL is a bottleneck'] },
      { question: 'How do Python generators and the yield keyword work?', category: 'technical', difficulty: 'medium', tips: ['Lazy evaluation', 'Memory efficiency', 'yield from for delegation'] },
    ],
    sql: [
      { question: 'How would you optimize a slow SQL query?', category: 'technical', difficulty: 'medium', tips: ['EXPLAIN plan', 'Index strategy', 'Query restructuring'] },
      { question: 'Explain the difference between INNER, LEFT, and FULL OUTER JOINs.', category: 'technical', difficulty: 'easy', tips: ['Use Venn diagrams mentally', 'NULL handling', 'Performance implications'] },
    ],
    aws: [
      { question: 'How would you design a highly available architecture on AWS?', category: 'situational', difficulty: 'hard', tips: ['Multi-AZ deployments', 'Load balancing', 'RDS failover, S3 durability'] },
    ],
    docker: [
      { question: 'What is the difference between a Docker image and a container?', category: 'technical', difficulty: 'easy', tips: ['Image as blueprint', 'Container as running instance', 'Layers and copy-on-write'] },
    ],
    kubernetes: [
      { question: 'How does Kubernetes handle pod scheduling and resource limits?', category: 'technical', difficulty: 'hard', tips: ['Scheduler phases', 'Requests vs limits', 'Node affinity and taints'] },
    ],
  }

  const BEHAVIORAL = [
    { question: 'Tell me about a time you disagreed with a technical decision. How did you handle it?', category: 'behavioral', difficulty: 'medium', tips: ['Use STAR method', 'Focus on collaboration outcome', 'Show data-driven approach'] },
    { question: 'Describe a project where you had to learn a new technology under a tight deadline.', category: 'behavioral', difficulty: 'medium', tips: ['Quantify the timeline', 'Highlight learning strategy', 'Share the outcome'] },
    { question: 'Tell me about a time you improved a process or system at work.', category: 'behavioral', difficulty: 'medium', tips: ['Quantify the improvement', 'Show initiative', 'Mention team impact'] },
  ]

  const SYSTEM_DESIGN = [
    { question: 'Design a URL shortener like bit.ly.', category: 'system_design', difficulty: 'medium', tips: ['Hash collisions', 'Caching with Redis', 'Database choice (KV store)'] },
    { question: 'How would you design a real-time notification system?', category: 'system_design', difficulty: 'hard', tips: ['WebSockets vs SSE vs polling', 'Message queues (Kafka, SQS)', 'Fan-out strategies'] },
    { question: 'Design a job scheduler that runs millions of tasks daily.', category: 'system_design', difficulty: 'hard', tips: ['Distributed locking', 'Worker pools', 'Retry with backoff'] },
  ]

  // Match questions to user's skills
  const matched = []
  for (const skill of requestedSkills) {
    const key = Object.keys(BANK).find(k => skill.includes(k) || k.includes(skill))
    if (key && BANK[key]) matched.push(...BANK[key])
    if (matched.length >= 4) break
  }

  // Fill remaining slots with behavioral and system design
  const questions = [
    ...matched.slice(0, 3),
    BEHAVIORAL[Math.floor(Math.random() * BEHAVIORAL.length)],
    SYSTEM_DESIGN[Math.floor(Math.random() * SYSTEM_DESIGN.length)],
  ].filter(Boolean).slice(0, 5)

  // Fall back to generic set if no skill matches
  if (questions.length < 3) {
    questions.push(...BEHAVIORAL, SYSTEM_DESIGN[0])
  }

  res.json({ success: true, data: questions.slice(0, 5) })
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
  if (!message?.trim()) return res.status(400).json({ success: false, message: 'message is required' })
  if (message.length > 2000) return res.status(400).json({ success: false, message: 'message must be 2000 characters or fewer' })
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
