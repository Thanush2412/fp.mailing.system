import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import emailRoutes from './routes/email.js'
import templateRoutes from './routes/templates.js'
import settingsRoutes from './routes/settings.js'
import { authMiddleware } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json())

// Health check (Public)
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'FP HR mailing System API', version: '1.0.0' })
})

// Auth Verification (Protected)
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user })
})

// Protected API Routes
app.use('/api/email', authMiddleware, emailRoutes)
app.use('/api/templates', authMiddleware, templateRoutes)
app.use('/api/settings', authMiddleware, settingsRoutes)

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }))

app.listen(PORT, () => {
  console.log(`FP HR mailing System backend running on http://localhost:${PORT}`)
  console.log(`Gmail user: ${process.env.GMAIL_USER || '⚠ GMAIL_USER not set'}`)
})
