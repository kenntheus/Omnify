const mongoose = require('mongoose')

exports.errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    error = { statusCode: 400, message: `${field} already exists` }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    error = { statusCode: 400, message: messages.join('. ') }
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = { statusCode: 400, message: `Invalid ${err.path}: ${err.value}` }
  }

  // JWT errors (already handled in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 401, message: 'Invalid token' }
  }

  const statusCode = error.statusCode || err.status || 500
  const message = error.message || 'Internal server error'

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
