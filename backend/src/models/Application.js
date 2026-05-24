const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: {
    type: String,
    enum: ['saved', 'applied', 'pending', 'reviewing', 'phone_screen', 'interview', 'technical', 'final_interview', 'offer', 'accepted', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true,
  },
  appliedAt: Date,
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  coverLetter: String,
  notes: String,
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    automated: { type: Boolean, default: false },
  }],
  interviews: [{
    type: { type: String, enum: ['phone', 'video', 'onsite', 'technical', 'panel'] },
    scheduledAt: Date,
    duration: Number,
    location: String,
    meetingLink: String,
    interviewer: String,
    notes: String,
    completed: { type: Boolean, default: false },
    feedback: String,
  }],
  offer: {
    salary: Number,
    currency: { type: String, default: 'USD' },
    equity: String,
    bonus: Number,
    startDate: Date,
    benefits: [String],
    deadline: Date,
    accepted: Boolean,
    notes: String,
  },
  automatedApply: { type: Boolean, default: false },
  customAnswers: { type: Map, of: String },
  followUpDate: Date,
  matchScore: Number,
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret } },
})

applicationSchema.index({ userId: 1, status: 1 })
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true })
applicationSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Application', applicationSchema)
