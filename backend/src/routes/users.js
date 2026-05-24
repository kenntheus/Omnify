const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const User = require('../models/User')

router.get('/profile', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user })
}))

router.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'profile', 'preferences']
  const updates = {}
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field] })

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
  res.json({ success: true, data: user, message: 'Profile updated' })
}))

router.put('/preferences', protect, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { preferences: { ...req.user.preferences.toObject(), ...req.body } },
    { new: true }
  )
  res.json({ success: true, data: user.preferences })
}))

router.delete('/account', protect, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false })
  res.json({ success: true, message: 'Account deactivated' })
}))

module.exports = router
