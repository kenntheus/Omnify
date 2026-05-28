/**
 * Job Seeder
 * Run: node backend/scripts/seedJobs.js
 *
 * Strategy:
 *   1. Fetch real remote jobs from the Remotive public API (no key needed)
 *   2. Upsert into MongoDB by sourceId so re-runs don't duplicate
 *   3. If Remotive is unreachable, fall back to the built-in featured jobs list
 */

const mongoose = require('mongoose')
const axios = require('axios')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const Job = require('../src/models/Job')

// ── Helpers ───────────────────────────────────────────────────
function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
}

function mapJobType(type = '') {
  const map = { full_time: 'full-time', part_time: 'part-time', contract: 'contract', freelance: 'freelance' }
  return map[type] || 'full-time'
}

const TECH_SKILLS = new Set([
  'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt',
  'node.js', 'express', 'fastapi', 'django', 'flask', 'rails', 'spring',
  'javascript', 'typescript', 'python', 'java', 'golang', 'go', 'ruby',
  'php', 'rust', 'swift', 'kotlin', 'scala', 'c++', 'c#', 'elixir',
  'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ansible',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'graphql', 'rest', 'grpc', 'kafka', 'rabbitmq', 'spark',
  'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'llm',
  'ci/cd', 'github actions', 'jenkins', 'git', 'linux',
  'figma', 'sketch', 'product management', 'agile', 'scrum',
])

function extractSkills(tags = [], category = '') {
  const candidates = [...tags, category].map(t => t.toLowerCase().trim())
  const matched = candidates.filter(t => TECH_SKILLS.has(t) || [...TECH_SKILLS].some(s => t.includes(s)))
  // Also keep short tags that look like skills even if not in our set
  const short = candidates.filter(t => t.length <= 20 && t.length >= 2 && !matched.includes(t))
  return [...new Set([...matched, ...short])].slice(0, 10)
}

// ── Remotive integration ───────────────────────────────────────
async function fetchFromRemotive() {
  const CATEGORIES = ['software-dev', 'devops-sysadmin', 'design', 'product', 'data', 'qa']
  let all = []
  for (const cat of CATEGORIES) {
    try {
      const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
        params: { category: cat, limit: 25 },
        timeout: 12000,
      })
      all = all.concat(data.jobs || [])
      process.stdout.write('.')
    } catch {
      process.stdout.write('x')
    }
  }
  console.log()
  return all
}

function remotiveToJob(job) {
  return {
    title: job.title,
    company: {
      name: job.company_name,
      logo: job.company_logo || undefined,
      industry: job.category || undefined,
    },
    location: job.candidate_required_location || 'Worldwide',
    remote: 'remote',
    description: stripHtml(job.description),
    requirements: [],
    responsibilities: [],
    benefits: [],
    skills: extractSkills(job.tags, job.category),
    tags: (job.tags || []).slice(0, 10),
    type: mapJobType(job.job_type),
    source: 'scraped',
    sourceUrl: job.url,
    sourceId: `remotive-${job.id}`,
    postedAt: new Date(job.publication_date),
    isActive: true,
    experience: 'Not specified',
  }
}

// ── Static featured jobs (used as fallback or merged with API data) ──
const FEATURED_JOBS = [
  {
    title: 'Senior Frontend Engineer',
    company: { name: 'Stripe', industry: 'FinTech', size: '5000-10000' },
    location: 'San Francisco, CA',
    remote: 'hybrid',
    salary: { min: 160000, max: 220000, currency: 'USD', period: 'yearly' },
    description: 'Join Stripe\'s frontend platform team to build the infrastructure that powers our global payment network. You will architect and implement user-facing systems used by millions of businesses worldwide, collaborate closely with product, design, and backend engineers, and drive engineering excellence across the organization.',
    requirements: ['5+ years React experience', 'Strong TypeScript skills', 'Experience with large-scale web applications', 'Familiarity with performance optimization'],
    responsibilities: ['Lead frontend architecture decisions', 'Build reusable component libraries', 'Mentor junior engineers', 'Partner with product and design'],
    benefits: ['Equity', '401k match', 'Health/dental/vision', 'Remote-friendly', 'Learning budget'],
    skills: ['react', 'typescript', 'node.js', 'graphql', 'css', 'webpack'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://stripe.com/jobs', sourceId: 'featured-stripe-sfe',
    experience: '5+ years', isActive: true,
  },
  {
    title: 'Staff Software Engineer — Infrastructure',
    company: { name: 'Vercel', industry: 'Developer Tools', size: '500-1000' },
    location: 'Remote',
    remote: 'remote',
    salary: { min: 180000, max: 250000, currency: 'USD', period: 'yearly' },
    description: 'Help Vercel build the fastest frontend platform on the planet. You will work on our global edge network, serverless functions runtime, and deploy pipeline — touching millions of deployments per day. This is a high-impact, high-autonomy role for engineers who want to shape the future of web infrastructure.',
    requirements: ['7+ years software engineering', 'Expert knowledge of distributed systems', 'Strong Golang or Rust experience', 'Experience with CDN/edge computing'],
    responsibilities: ['Design and scale global infrastructure', 'Improve deploy pipeline performance', 'Drive reliability and observability initiatives', 'Technical leadership across teams'],
    benefits: ['Fully remote', 'Competitive equity', 'Unlimited PTO', 'Top-tier health benefits', 'Home office stipend'],
    skills: ['golang', 'rust', 'kubernetes', 'aws', 'distributed systems', 'docker', 'ci/cd'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://vercel.com/careers', sourceId: 'featured-vercel-staff',
    experience: '7+ years', isActive: true,
  },
  {
    title: 'Product Designer — Growth',
    company: { name: 'Linear', industry: 'SaaS / Productivity', size: '50-200' },
    location: 'Remote',
    remote: 'remote',
    salary: { min: 130000, max: 170000, currency: 'USD', period: 'yearly' },
    description: 'Design the future of software project management at Linear. You\'ll own end-to-end design for our growth surfaces — onboarding, activation, and viral loops — with direct impact on user acquisition and retention. Linear is used by some of the best product teams in the world.',
    requirements: ['4+ years product design experience', 'Strong portfolio showing end-to-end product work', 'Experience with B2B SaaS', 'Proficiency with Figma'],
    responsibilities: ['Own design for growth and onboarding flows', 'Conduct user research and usability testing', 'Collaborate with engineering on implementation', 'Contribute to design system'],
    benefits: ['Remote-first', 'Equity', 'Annual retreats', 'Equipment budget', 'Health benefits'],
    skills: ['figma', 'product design', 'user research', 'prototyping', 'design systems'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://linear.app/careers', sourceId: 'featured-linear-designer',
    experience: '4+ years', isActive: true,
  },
  {
    title: 'Full Stack Engineer',
    company: { name: 'Notion', industry: 'SaaS / Productivity', size: '500-1000' },
    location: 'New York, NY',
    remote: 'hybrid',
    salary: { min: 140000, max: 190000, currency: 'USD', period: 'yearly' },
    description: 'Build the connected workspace platform trusted by over 20 million people. You\'ll work across the full stack — from our React/TypeScript frontend to our Node.js backend and PostgreSQL databases — shipping features that affect how people organize their work and life.',
    requirements: ['3+ years full-stack experience', 'Proficiency in React and TypeScript', 'Experience with SQL databases', 'Strong product sense'],
    responsibilities: ['Build and ship product features end-to-end', 'Collaborate with design to create delightful UX', 'Write clean, well-tested code', 'Participate in on-call rotation'],
    benefits: ['Hybrid flexibility', 'Equity', 'Health/dental/vision', 'Catered meals', '401k'],
    skills: ['react', 'typescript', 'node.js', 'postgresql', 'redis', 'graphql'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://notion.so/careers', sourceId: 'featured-notion-fse',
    experience: '3+ years', isActive: true,
  },
  {
    title: 'Machine Learning Engineer — LLMs',
    company: { name: 'Anthropic', industry: 'AI / Research', size: '200-500' },
    location: 'San Francisco, CA',
    remote: 'hybrid',
    salary: { min: 200000, max: 320000, currency: 'USD', period: 'yearly' },
    description: 'Work at the frontier of AI safety and capability research. You\'ll train and evaluate large language models, develop new fine-tuning and alignment techniques, and collaborate with our research team to build AI systems that are safe, reliable, and beneficial.',
    requirements: ['Strong ML background', 'Experience training large neural networks', 'Python and PyTorch proficiency', 'Published research preferred'],
    responsibilities: ['Train and evaluate language models', 'Implement and research alignment techniques', 'Write clean, well-documented code', 'Collaborate with research scientists'],
    benefits: ['Mission-driven work', 'Competitive equity', 'Exceptional health benefits', 'Research budget', 'Flexible PTO'],
    skills: ['python', 'pytorch', 'tensorflow', 'machine learning', 'deep learning', 'llm', 'distributed systems'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://anthropic.com/careers', sourceId: 'featured-anthropic-mle',
    experience: '4+ years', isActive: true,
  },
  {
    title: 'Backend Engineer — Payments',
    company: { name: 'Shopify', industry: 'eCommerce', size: '10000+' },
    location: 'Remote (Canada/US)',
    remote: 'remote',
    salary: { min: 140000, max: 195000, currency: 'USD', period: 'yearly' },
    description: 'Join Shopify Payments and help entrepreneurs worldwide get paid. You\'ll build and scale the backend systems processing billions of dollars in transactions, work on fraud detection, banking integrations, and settlement infrastructure.',
    requirements: ['4+ years backend experience', 'Proficiency in Ruby or Go', 'Experience with payment systems or financial software', 'Strong understanding of distributed systems'],
    responsibilities: ['Build payment processing infrastructure', 'Integrate with banking and card networks', 'Improve fraud detection systems', 'Ensure 99.99% uptime for critical services'],
    benefits: ['Fully remote', 'Equity', 'Benefits and retirement plan', 'Parental leave', 'Learning budget'],
    skills: ['ruby', 'golang', 'postgresql', 'redis', 'kafka', 'aws'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://shopify.com/careers', sourceId: 'featured-shopify-payments',
    experience: '4+ years', isActive: true,
  },
  {
    title: 'DevOps Engineer — Platform',
    company: { name: 'GitHub', industry: 'Developer Tools', size: '3000-5000' },
    location: 'Remote',
    remote: 'remote',
    salary: { min: 150000, max: 210000, currency: 'USD', period: 'yearly' },
    description: 'Help GitHub keep the world\'s largest code platform running. You\'ll work on internal developer platforms, CI/CD infrastructure, and the systems that help 100M+ developers ship code reliably every day.',
    requirements: ['5+ years DevOps/SRE experience', 'Expert Kubernetes knowledge', 'Strong scripting (Bash/Python)', 'Experience with large-scale infrastructure'],
    responsibilities: ['Maintain and scale Kubernetes clusters', 'Build internal developer tooling', 'Respond to and reduce incidents', 'Drive infrastructure as code practices'],
    benefits: ['Remote-first', 'Comprehensive health benefits', 'Retirement', 'Professional development', 'Home office budget'],
    skills: ['kubernetes', 'docker', 'terraform', 'aws', 'python', 'ci/cd', 'github actions', 'linux'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://github.com/about/careers', sourceId: 'featured-github-devops',
    experience: '5+ years', isActive: true,
  },
  {
    title: 'iOS Engineer',
    company: { name: 'Figma', industry: 'Design Tools', size: '1000-3000' },
    location: 'San Francisco, CA',
    remote: 'hybrid',
    salary: { min: 160000, max: 215000, currency: 'USD', period: 'yearly' },
    description: 'Build the iOS app used by designers and product teams at the world\'s best companies. You\'ll work on Figma\'s native mobile experience, pushing the limits of what\'s possible with complex rendering, real-time collaboration, and touch interactions.',
    requirements: ['4+ years iOS development', 'Expert Swift knowledge', 'Experience with UIKit and SwiftUI', 'Understanding of rendering pipelines'],
    responsibilities: ['Build and ship iOS app features', 'Work on performance and rendering', 'Collaborate with design on motion and interactions', 'Review code and mentor peers'],
    benefits: ['Competitive equity', 'Health/dental/vision', 'Remote-friendly', 'Learning budget', 'Team offsites'],
    skills: ['swift', 'swiftui', 'uikit', 'ios', 'xcode', 'core data'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://figma.com/careers', sourceId: 'featured-figma-ios',
    experience: '4+ years', isActive: true,
  },
  {
    title: 'Data Engineer',
    company: { name: 'Airbnb', industry: 'Travel / Marketplace', size: '5000-10000' },
    location: 'San Francisco, CA',
    remote: 'hybrid',
    salary: { min: 155000, max: 210000, currency: 'USD', period: 'yearly' },
    description: 'Build the data infrastructure that powers Airbnb\'s marketplace intelligence. You\'ll work on petabyte-scale data pipelines, real-time streaming systems, and the data products used by every team at Airbnb to make decisions.',
    requirements: ['4+ years data engineering', 'Expert SQL and Python skills', 'Experience with Spark and Kafka', 'Strong understanding of data modeling'],
    responsibilities: ['Design and build data pipelines', 'Maintain data quality and observability', 'Partner with analytics and ML teams', 'Improve platform reliability'],
    benefits: ['Equity', 'Travel credits', 'Health benefits', '401k', 'Flexible work'],
    skills: ['python', 'spark', 'kafka', 'sql', 'airflow', 'aws', 'dbt'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://careers.airbnb.com', sourceId: 'featured-airbnb-de',
    experience: '4+ years', isActive: true,
  },
  {
    title: 'Engineering Manager — Frontend Platform',
    company: { name: 'Atlassian', industry: 'SaaS / Developer Tools', size: '10000+' },
    location: 'Remote',
    remote: 'remote',
    salary: { min: 180000, max: 240000, currency: 'USD', period: 'yearly' },
    description: 'Lead a team of senior engineers building the frontend platform that powers Jira, Confluence, and all Atlassian cloud products. You\'ll drive technical vision, grow engineers, and collaborate across product and design to improve developer experience.',
    requirements: ['3+ years engineering management', 'Strong frontend engineering background', 'Experience building platform teams', 'Excellent communication skills'],
    responsibilities: ['Lead and grow a team of 6-8 engineers', 'Define technical roadmap for frontend platform', 'Partner with product and design leadership', 'Drive cross-functional engineering initiatives'],
    benefits: ['Remote-first', 'Generous equity', 'Global health benefits', 'Parental leave', 'Volunteer time off'],
    skills: ['react', 'typescript', 'engineering management', 'agile', 'webpack', 'design systems'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://jobs.lever.co/atlassian', sourceId: 'featured-atlassian-em',
    experience: '7+ years total', isActive: true,
  },
  {
    title: 'Security Engineer',
    company: { name: 'Cloudflare', industry: 'Networking / Security', size: '3000-5000' },
    location: 'Remote',
    remote: 'remote',
    salary: { min: 155000, max: 205000, currency: 'USD', period: 'yearly' },
    description: 'Protect the internet at Cloudflare\'s scale. You\'ll work on threat intelligence, vulnerability research, and security engineering for a network that handles 20% of global internet traffic. This role combines deep technical work with meaningful impact.',
    requirements: ['5+ years security engineering', 'Experience with network security', 'Proficiency in Go or Rust', 'Understanding of TLS/cryptography'],
    responsibilities: ['Identify and mitigate security vulnerabilities', 'Build security tooling and automation', 'Conduct threat modeling', 'Collaborate with trust & safety'],
    benefits: ['Remote-first', 'Equity', 'Health benefits', 'Home office stipend', 'Learning budget'],
    skills: ['golang', 'rust', 'python', 'linux', 'networking', 'cryptography', 'kubernetes'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://cloudflare.com/careers', sourceId: 'featured-cloudflare-sec',
    experience: '5+ years', isActive: true,
  },
  {
    title: 'Technical Product Manager — API Platform',
    company: { name: 'Twilio', industry: 'Communications / API', size: '5000-10000' },
    location: 'Remote',
    remote: 'remote',
    salary: { min: 145000, max: 195000, currency: 'USD', period: 'yearly' },
    description: 'Shape the developer experience for Twilio\'s core messaging and voice APIs used by over 250,000 companies. You\'ll own the product roadmap, work directly with enterprise customers, and partner with engineering to ship APIs that set the industry standard.',
    requirements: ['3+ years product management', 'Technical background (engineering preferred)', 'API product experience', 'Strong communication and data analysis skills'],
    responsibilities: ['Own product roadmap for API platform', 'Define API specifications and design', 'Gather customer feedback and translate to requirements', 'Work with engineering, design, and GTM'],
    benefits: ['Remote-first', 'Equity', 'Health benefits', 'Learning stipend', 'Flexible PTO'],
    skills: ['product management', 'rest', 'graphql', 'agile', 'sql', 'user research'],
    type: 'full-time', source: 'manual', sourceUrl: 'https://twilio.com/company/jobs', sourceId: 'featured-twilio-pm',
    experience: '3+ years', isActive: true,
  },
]

// ── Seeder ────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omnify'
  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  // Insert featured jobs first (always available)
  console.log(`\nUpserting ${FEATURED_JOBS.length} featured jobs...`)
  let featuredCount = 0
  for (const job of FEATURED_JOBS) {
    try {
      await Job.findOneAndUpdate(
        { sourceId: job.sourceId },
        { ...job, postedAt: new Date(Date.now() - Math.random() * 7 * 86400000) },
        { upsert: true, new: true, runValidators: false }
      )
      featuredCount++
    } catch (err) {
      console.warn(`  Skip ${job.title}: ${err.message}`)
    }
  }
  console.log(`  ${featuredCount} featured jobs upserted`)

  // Fetch from Remotive
  console.log('\nFetching from Remotive API (this may take ~30s)...')
  let remotiveJobs = []
  try {
    remotiveJobs = await fetchFromRemotive()
  } catch (err) {
    console.warn('Remotive fetch failed:', err.message)
  }

  if (remotiveJobs.length > 0) {
    console.log(`Upserting ${remotiveJobs.length} Remotive jobs...`)
    let remCount = 0
    for (const job of remotiveJobs) {
      try {
        await Job.findOneAndUpdate(
          { sourceId: `remotive-${job.id}` },
          remotiveToJob(job),
          { upsert: true, new: true, runValidators: false }
        )
        remCount++
        if (remCount % 20 === 0) process.stdout.write('.')
      } catch {
        // skip
      }
    }
    console.log(`\n  ${remCount} Remotive jobs upserted`)
  } else {
    console.log('  Remotive unavailable — only featured jobs seeded')
  }

  const total = await Job.countDocuments()
  console.log(`\nDone. Total jobs in database: ${total}`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
