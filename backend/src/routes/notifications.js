const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const Notification = require('../models/Notification')

router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100)
  const notifs = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * safeLimit)
    .limit(safeLimit)
  res.json({ success: true, data: notifs })
}))

router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, read: false })
  res.json({ success: true, data: { count } })
}))

router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true })
  res.json({ success: true })
}))

router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true })
  res.json({ success: true })
}))

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  res.json({ success: true })
}))

module.exports = router
