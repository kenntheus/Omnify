const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false,
  },
  avatar: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subscription: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  profile: {
    title: String,
    location: String,
    phone: String,
    bio: String,
    linkedin: String,
    github: String,
    portfolio: String,
    skills: [{ type: String, trim: true }],
    experience: [{
      company: String,
      title: String,
      startDate: Date,
      endDate: Date,
      current: { type: Boolean, default: false },
      description: String,
      skills: [String],
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number,
    }],
    desiredSalaryMin: Number,
    desiredSalaryMax: Number,
    desiredLocations: [String],
    remotePreference: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite', 'any'],
      default: 'any',
    },
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
    jobAlerts: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  },
  refreshTokens: [{ type: String }],
  passwordResetToken: String,
  passwordResetExpires: Date,
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  profileCompletionScore: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret.password
      delete ret.refreshTokens
      delete ret.passwordResetToken
      delete ret.passwordResetExpires
      delete ret.__v
      return ret
    },
  },
})

// ─── Indexes ──────────────────────────────────────────────────
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ createdAt: -1 })

// ─── Hash password before save ────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ─── Compare password ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// ─── Profile completion score ─────────────────────────────────
userSchema.methods.calculateProfileScore = function () {
  let score = 0
  const p = this.profile
  if (this.name) score += 10
  if (this.email) score += 10
  if (p.title) score += 10
  if (p.location) score += 10
  if (p.bio) score += 10
  if (p.skills?.length > 0) score += 15
  if (p.experience?.length > 0) score += 15
  if (p.education?.length > 0) score += 10
  if (p.linkedin) score += 5
  if (p.github || p.portfolio) score += 5
  return score
}

module.exports = mongoose.model('User', userSchema)
