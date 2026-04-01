import { Router } from 'express'
import db from '../db.js'
import { config } from '../config.js'

const router = Router()

async function proxyToScript(payload) {
  const activeScript = await config.getActiveScript()
  if (!activeScript) throw new Error('No active script configured. Please check Settings.')
  
  const url = activeScript.url.trim()
  if (!url.startsWith('http')) throw new Error(`Invalid Apps Script URL: ${url}`)

  console.log(`[Mailer] Sending to: ${url} for ${payload.to}`)

  const enrichedPayload = {
    ...payload,
    sender_name: activeScript.name
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedPayload),
    })

    const contentType = res.headers.get('content-type') || ''
    
    if (!res.ok) {
      const text = await res.text()
      console.error(`[Mailer] Error ${res.status}:`, text.slice(0, 200))
      throw new Error(`Apps Script Error (${res.status})`)
    }

    const data = await res.json()
    console.log(`[Mailer] Success for ${payload.to}`)
    return data
  } catch (err) {
    console.error(`[Mailer] Execution failed:`, err.message)
    throw err
  }
}

router.post('/send', async (req, res) => {
  const { to, cc, subject, body, name, template, id, time } = req.body

  const activeScript = await config.getActiveScript()
  if (!activeScript) return res.status(400).json({ error: 'No active mail account configured. Check Settings.' })

  const sender_name = activeScript.name
  const logId = id || Math.random().toString(36).slice(2, 9)
  const timestamp = new Date()

  try {
    // Initial log entry
    await db.collection('logs').doc(logId).set({
      name: name || null,
      email: to,
      cc: cc || null,
      subject,
      body: body || null,
      template: template || null,
      sender_name,
      status: 'pending',
      time: time || timestamp.toLocaleString(),
      timestamp: timestamp
    })

    const result = await proxyToScript({ to, cc, subject, body, name })
    const finalStatus = result.status === 'sent' ? 'sent' : 'failed'
    const error = result.error || null
    
    await db.collection('logs').doc(logId).update({ status: finalStatus, error })
    res.json({ status: finalStatus, error })
  } catch (err) {
    await db.collection('logs').doc(logId).update({ status: 'failed', error: err.message })
    res.status(500).json({ status: 'failed', error: err.message })
  }
})

// ─── Log Management ─────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  const { status, search } = req.query
  try {
    let q = db.collection('logs')

    if (status && status !== 'all') {
      q = q.where('status', '==', status)
    }

    q = q.orderBy('timestamp', 'desc').limit(500)
    
    const snapshot = await q.get()
    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    if (search) {
      const s = search.toLowerCase()
      logs = logs.filter(l => 
        (l.name || '').toLowerCase().includes(s) || 
        (l.email || '').toLowerCase().includes(s) || 
        (l.subject || '').toLowerCase().includes(s)
      )
    }

    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/logs/stats', async (req, res) => {
  try {
    const snapshot = await db.collection('logs').get()
    const stats = { all: 0, sent: 0, failed: 0, pending: 0 }
    snapshot.forEach(doc => {
      const data = doc.data()
      stats.all++
      if (data.status === 'sent') stats.sent++
      else if (data.status === 'failed') stats.failed++
      else if (data.status === 'pending') stats.pending++
    })
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/logs/:id', async (req, res) => {
  try {
    await db.collection('logs').doc(req.params.id).delete()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/logs/clear', async (req, res) => {
  try {
    const snapshot = await db.collection('logs').get()
    const batch = db.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/logs/delete-multiple', async (req, res) => {
  const { ids } = req.body
  try {
    const batch = db.batch()
    ids.forEach(id => batch.delete(db.collection('logs').doc(id)))
    await batch.commit()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
