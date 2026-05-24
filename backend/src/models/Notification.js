const mongoose = require('mongoose')
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['job_match', 'application_update', 'interview_reminder', 'system', 'tip'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  actionUrl: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, { timestamps: true })
schema.index({ userId: 1, read: 1 })
module.exports = mongoose.model('Notification', schema)
