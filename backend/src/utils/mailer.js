const nodemailer = require('nodemailer')

const isConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured — would have sent "${subject}" to ${to}`)
    return
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Omnify <noreply@omnify.ai>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  })
}

module.exports = { sendEmail }
