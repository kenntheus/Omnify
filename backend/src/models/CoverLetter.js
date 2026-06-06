const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  content: { type: String, required: true, maxlength: 10000 },
  tone: { type: String, enum: ['professional', 'enthusiastic', 'formal', 'creative'], default: 'professional' },
  edited: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
}, { timestamps: true })
module.exports = mongoose.model('CoverLetter', schema)
