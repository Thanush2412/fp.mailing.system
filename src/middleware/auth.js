import { OAuth2Client } from 'google-auth-library'
import db from '../db.js'

const CLIENT_ID = "1073636939203-sdthllpnm288560bh8bcd5fjma2o59s3.apps.googleusercontent.com"
const client = new OAuth2Client(CLIENT_ID)

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
      clockTolerance: 10
    })
    const payload = ticket.getPayload()
    const email = payload.email

    // ─── Firestore Check: Is this email allowed? ───
    if (!db) return res.status(500).json({ error: 'Database not initialized' })
    
    const userDoc = await db.collection('allowed_users').doc(email).get()
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: `Access denied. Email ${email} is not authorized.` })
    }
    
    const userData = userDoc.data()
    
    // Attach user info to request
    req.user = {
      email: email,
      role: userData.role || 'user',
      name: payload.name,
      picture: payload.picture
    }
    
    next()
  } catch (err) {
    console.error('Auth Error:', err.message)
    res.status(401).json({ error: 'Invalid Google token' })
  }
}
