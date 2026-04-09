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
    // Get existing script IDs to detect deletions
    const existing = await db.collection('mail_configs').get()
    const existingIds = new Set(existing.docs.map(d => d.id))
    const incomingIds = new Set(scripts.map(s => s.id))

    const batch = db.batch()

    // Delete scripts that were removed
    for (const id of existingIds) {
      if (!incomingIds.has(id)) {
        batch.delete(db.collection('mail_configs').doc(id))
      }
    }

    // Upsert incoming scripts
    for (const s of scripts) {
      const ref = db.collection('mail_configs').doc(s.id)
      batch.set(ref, {
        name: s.name,
        url: s.url,
        email: s.email,
        is_active: s.id === activeId ? 1 : 0,
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
  // Prevent removing yourself (the requesting admin)
  if (email === req.user?.email) {
    return res.status(403).json({ error: 'Cannot remove your own admin account' })
  }
  try {
    await db.collection('allowed_users').doc(email).delete()
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
