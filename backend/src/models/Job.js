const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  company: {
    name: { type: String, required: true, trim: true },
    logo: String,
    industry: String,
    size: String,
    rating: Number,
    website: String,
    description: String,
  },
  location: { type: String, required: true },
  remote: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'onsite' },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
    period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' },
  },
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  skills: [{ type: String, trim: true, index: true }],
  experience: String,
  education: String,
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'], default: 'full-time' },
  source: { type: String, enum: ['linkedin', 'indeed', 'glassdoor', 'manual', 'scraped'], default: 'manual' },
  sourceUrl: String,
  sourceId: { type: String, unique: true, sparse: true },
  postedAt: { type: Date, default: Date.now },
  deadline: Date,
  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  applicants: { type: Number, default: 0 },
  tags: [String],
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret } },
})

jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text' })
jobSchema.index({ location: 1 })
jobSchema.index({ remote: 1 })
jobSchema.index({ type: 1 })
jobSchema.index({ postedAt: -1 })
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 })
jobSchema.index({ isActive: 1 })

module.exports = mongoose.model('Job', jobSchema)
