import { Router } from 'express'
import db from '../db.js'
import { DEFAULT_TEMPLATES } from '../templatesData.js'

const router = Router()

// Initialize templates if empty
async function seedTemplates() {
  if (!db) return
  const snapshot = await db.collection('templates').limit(1).get()
  if (snapshot.empty) {
    const batch = db.batch()
    DEFAULT_TEMPLATES.forEach(t => {
      const ref = db.collection('templates').doc(t.id)
      batch.set(ref, { name: t.name, subject: t.subject, body: t.body })
    })
    await batch.commit()
  }
}

router.get('/', async (req, res) => {
  try {
    await seedTemplates()
    const snapshot = await db.collection('templates').orderBy('name').get()
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json(templates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  const { id, name, subject, body } = req.body
  try {
    const templateData = { name, subject, body }
    if (id) {
      await db.collection('templates').doc(id).set(templateData, { merge: true })
      res.json({ id, ...templateData })
    } else {
      const docRef = await db.collection('templates').add(templateData)
      res.json({ id: docRef.id, ...templateData })
    }
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
