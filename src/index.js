import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import emailRoutes from './routes/email.js'
import templateRoutes from './routes/templates.js'
import settingsRoutes from './routes/settings.js'
import { authMiddleware } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

// Vercel-Compatible Manual CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  next()
})

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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`FP HR mailing System backend running on http://localhost:${PORT}`)
  })
}

export default app
