import nodemailer from 'nodemailer'
import { buildEmailHtml, stripHtml } from './emailTemplate.js'

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
  return _transporter
}

export async function sendMail({ to, subject, name, message, html, cta_url, cta_label }) {
  const htmlBody = buildEmailHtml({ name, subject, message, html, cta_url, cta_label })

  await getTransporter().sendMail({
    from: `"${process.env.SENDER_NAME || 'FP HR mailing System'}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: stripHtml(htmlBody),
    html: htmlBody,
  })
}
