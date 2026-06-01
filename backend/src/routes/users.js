const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const User = require('../models/User')

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
    filename: (req, file, cb) => cb(null, `${req.user._id}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

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
  const allowed = ['emailNotifications', 'pushNotifications', 'weeklyDigest', 'jobAlerts', 'theme', 'language', 'currency', 'dateFormat']
  const updates = {}
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { preferences: { ...req.user.preferences.toObject(), ...updates } },
    { new: true, runValidators: true }
  )
  res.json({ success: true, data: user.preferences })
}))

router.post('/avatar', protect, avatarUpload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const avatarUrl = `/uploads/avatars/${req.file.filename}`
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true })
  res.json({ success: true, data: user, message: 'Avatar updated' })
}))

router.delete('/account', protect, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false })
  res.json({ success: true, message: 'Account deactivated' })
}))

module.exports = router
