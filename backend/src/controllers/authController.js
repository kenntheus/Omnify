const User = require('../models/User')
const { generateTokens } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// ─── Register ─────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' })
  }

  const user = await User.create({ name, email, password })
  const { token, refreshToken } = generateTokens(user._id)

  // Store refresh token
  user.refreshTokens = [refreshToken]
  await user.save({ validateBeforeSave: false })

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user, token, refreshToken },
  })
})

// ─── Login ────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated' })
  }

  const { token, refreshToken } = generateTokens(user._id)

  // Update refresh tokens (keep last 5)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken]
  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  // Remove password from response
  user.password = undefined

  res.json({
    success: true,
    message: 'Login successful',
    data: { user, token, refreshToken },
  })
})

// ─── Logout ───────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (refreshToken) {
    req.user.refreshTokens = req.user.refreshTokens.filter(t => t !== refreshToken)
    await req.user.save({ validateBeforeSave: false })
  }

  res.json({ success: true, message: 'Logged out successfully' })
})

// ─── Get current user ─────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, data: user })
})

// ─── Refresh token ────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' })
  }

  let decoded
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
  }

  const user = await User.findById(decoded.id)
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }

  const { token: newToken, refreshToken: newRefreshToken } = generateTokens(user._id)

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken)
  user.refreshTokens.push(newRefreshToken)
  await user.save({ validateBeforeSave: false })

  res.json({
    success: true,
    data: { token: newToken, refreshToken: newRefreshToken },
  })
})

// ─── Forgot password ──────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    // Don't reveal if email exists
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent' })
  }

  const token = crypto.randomBytes(32).toString('hex')
  user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000 // 30 min
  await user.save({ validateBeforeSave: false })

  // In production, send email here
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  console.log('Password reset URL:', resetUrl)

  // Expose token in dev so the UI can surface it without email
  const data = process.env.NODE_ENV !== 'production' ? { resetToken: token } : undefined
  res.json({ success: true, message: 'Password reset link sent to your email', data })
})

// ─── Change password (authenticated) ─────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.user._id).select('+password')
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' })
  }

  user.password = newPassword
  user.refreshTokens = []
  await user.save()

  const { token, refreshToken } = generateTokens(user._id)
  user.refreshTokens = [refreshToken]
  await user.save({ validateBeforeSave: false })

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: { token, refreshToken },
  })
})

// ─── Reset password ───────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
  }

  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  user.refreshTokens = []
  await user.save()

  const { token: newToken, refreshToken } = generateTokens(user._id)

  res.json({
    success: true,
    message: 'Password reset successful',
    data: { token: newToken, refreshToken },
  })
})
