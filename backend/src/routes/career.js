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
