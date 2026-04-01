import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import fs from 'fs';

// ─── Setup paths ───
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data.db');

// ─── Load Service Account ───
// Assuming you have the service account file locally for this migration
const serviceAccountPath = path.resolve(__dirname, '../firebase-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: firebase-key.json not found in backend/ folder.");
  console.log("Please place your Firebase Service Account JSON file there and rename it to 'firebase-key.json'.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fdb = admin.firestore();
const sqlite = new Database(dbPath);

async function migrate() {
  console.log("🚀 Starting Migration: SQLite -> Firestore...");

  // 1. Migrate allowed_users
  console.log("👥 Migrating allowed_users...");
  const users = sqlite.prepare('SELECT * FROM allowed_users').all();
  for (const u of users) {
    await fdb.collection('allowed_users').doc(u.email).set({
      email: u.email,
      role: u.role,
      added_at: u.added_at
    });
  }
  console.log(`✅ Migrated ${users.length} users.`);

  // 2. Migrate templates
  console.log("📄 Migrating templates...");
  const templates = sqlite.prepare('SELECT * FROM templates').all();
  for (const t of templates) {
    await fdb.collection('templates').doc(t.id).set({
      name: t.name,
      subject: t.subject,
      body: t.body
    });
  }
  console.log(`✅ Migrated ${templates.length} templates.`);

  // 3. Migrate mail_configs
  console.log("⚙️ Migrating mail_configs...");
  // Check if table exists (handles old 'scripts' vs new 'mail_configs')
  let configTable = 'mail_configs';
  try { sqlite.prepare('SELECT 1 FROM mail_configs LIMIT 1').get(); }
  catch(e) { configTable = 'scripts'; }

  const configs = sqlite.prepare(`SELECT * FROM ${configTable}`).all();
  for (const c of configs) {
    await fdb.collection('mail_configs').doc(c.id).set({
      name: c.name,
      url: c.url,
      email: c.email || '',
      is_active: c.is_active
    });
  }
  console.log(`✅ Migrated ${configs.length} mail configurations.`);

  // 4. Migrate logs
  console.log("📜 Migrating logs (limiting to last 100 for speed)...");
  const logs = sqlite.prepare('SELECT * FROM logs ORDER BY rowid DESC LIMIT 100').all();
  for (const l of logs) {
    await fdb.collection('logs').doc(l.id).set({
      name: l.name,
      email: l.email,
      cc: l.cc,
      subject: l.subject,
      body: l.body,
      template: l.template,
      sender_name: l.sender_name,
      status: l.status,
      error: l.error,
      time: l.time,
      timestamp: admin.firestore.FieldValue.serverTimestamp() // approximate
    });
  }
  console.log(`✅ Migrated ${logs.length} logs.`);

  console.log("\n✨ Migration Complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migration Failed:", err);
  process.exit(1);
});
