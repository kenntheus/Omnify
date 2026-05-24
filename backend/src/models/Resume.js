const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  fileSize: Number,
  isDefault: { type: Boolean, default: false },
  analysis: {
    atsScore: { type: Number, min: 0, max: 100 },
    overallScore: Number,
    formattingScore: Number,
    contentScore: Number,
    impactScore: Number,
    skills: [{
      name: String,
      category: { type: String, enum: ['technical', 'soft', 'language', 'tool'] },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
      yearsOfExperience: Number,
    }],
    experience: [{ company: String, role: String, duration: String, description: String }],
    education: [{ institution: String, degree: String, year: String }],
    keywords: [String],
    strengths: [String],
    improvements: [{
      category: { type: String, enum: ['content', 'formatting', 'keywords', 'impact'] },
      priority: { type: String, enum: ['high', 'medium', 'low'] },
      title: String,
      description: String,
      example: String,
    }],
    analyzedAt: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret } },
})

resumeSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Resume', resumeSchema)
