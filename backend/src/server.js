const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const hpp = require('hpp')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

// Load env variables
dotenv.config()

// Fail fast if required env vars are missing
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
if (process.env.NODE_ENV === 'production') REQUIRED_ENV.push('FRONTEND_URL')
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k])
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`)
  process.exit(1)
}

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const resumeRoutes = require('./routes/resumes')
const jobRoutes = require('./routes/jobs')
const applicationRoutes = require('./routes/applications')
const coverLetterRoutes = require('./routes/coverLetters')
const careerRoutes = require('./routes/career')
const notificationRoutes = require('./routes/notifications')
const adminRoutes = require('./routes/admin')

// Error handler
const { errorHandler } = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000

// ─── Security Middleware ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
})

app.use('/api', limiter)
app.use('/api/auth', authLimiter)

// Body parsing
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Sanitization
app.use(mongoSanitize())
app.use(hpp())

// Compression & logging
app.use(compression())
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// Avatars are public; resumes require auth (served via /api/resumes/:id/file)
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')))

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/cover-letters', coverLetterRoutes)
app.use('/api/career', careerRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Omnify API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// Error handler (must be last)
app.use(errorHandler)

// ─── Database connection ──────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omnify', {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}

// ─── Start server ─────────────────────────────────────────────
const startServer = async () => {
  // Ensure upload directories exist before multer tries to write to them
  ;['uploads/avatars', 'uploads/resumes'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  })

  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 Omnify API running on http://localhost:${PORT}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()

module.exports = app
