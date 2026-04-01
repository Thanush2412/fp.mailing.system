import { Router } from 'express'
import db from '../db.js'
import { DEFAULT_TEMPLATES } from '../templatesData.js'

const router = Router()

// Seed defaults into DB if collection is empty
async function seedTemplates() {
  try {
    const snapshot = await db.collection('templates').get()
    if (snapshot.empty && DEFAULT_TEMPLATES.length > 0) {
      console.log('Seeding default templates...')
      const batch = db.batch()
      DEFAULT_TEMPLATES.forEach(t => {
        const ref = db.collection('templates').doc(t.id)
        batch.set(ref, {
          name: t.name,
          subject: t.subject,
          body: t.body
        })
      })
      await batch.commit()
    }
  } catch (err) {
    console.error('Seeding error:', err.message)
  }
}

seedTemplates()

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('templates').get()
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { id, name, subject, body } = req.body
  try {
    if (id) {
      await db.collection('templates').doc(id).set({
        name,
        subject,
        body
      }, { merge: true })
    } else {
      await db.collection('templates').add({
        name,
        subject,
        body
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.collection('templates').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
