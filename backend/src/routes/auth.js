const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authController = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

// ─── Validation rules ─────────────────────────────────────────
const registerRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
]

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
]

// ─── Routes ───────────────────────────────────────────────────
router.post('/register', registerRules, validate, authController.register)
router.post('/login', loginRules, validate, authController.login)
router.post('/logout', protect, authController.logout)
router.get('/me', protect, authController.getMe)
router.post('/refresh', authController.refreshToken)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

module.exports = router
