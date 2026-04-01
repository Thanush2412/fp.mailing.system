import { Router } from 'express'
import { config } from '../config.js'
import db from '../db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const scripts = await config.getScripts()
    const activeId = await config.getActiveId()
    res.json({ scripts, activeId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { scripts, activeId } = req.body
  try {
    const batch = db.batch()
    
    // In Firestore, we update individual docs
    for (const s of scripts) {
      const ref = db.collection('mail_configs').doc(s.id)
      batch.set(ref, {
        name: s.name,
        url: s.url,
        email: s.email,
        is_active: s.id === activeId ? 1 : 0
      }, { merge: true })
    }
    
    await batch.commit()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.collection('mail_configs').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── User Access Management ──────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('allowed_users').get()
    const users = snapshot.docs.map(doc => doc.data())
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/users', async (req, res) => {
  const { email, role } = req.body
  try {
    await db.collection('allowed_users').doc(email).set({
      email,
      role: role || 'user',
      added_at: new Date().toISOString()
    })
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/users/:email', async (req, res) => {
  const { email } = req.params
  if (email === 'thanush@faceprep.in') {
    return res.status(403).json({ error: 'Cannot remove primary admin' })
  }
  try {
    await db.collection('allowed_users').doc(email).delete()
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
