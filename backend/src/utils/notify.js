/**
 * Fire-and-forget notification helper.
 * Never throws — notifications are non-critical and must not break the main request.
 */
const Notification = require('../models/Notification')

async function notify({ userId, type, title, message, actionUrl, metadata } = {}) {
  try {
    await Notification.create({ userId, type, title, message, actionUrl, metadata, read: false })
  } catch (err) {
    console.error('[notify] failed:', err.message)
  }
}

module.exports = { notify }
