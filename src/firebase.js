import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch 
} from "firebase/firestore";
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbInstance = null;
let is_admin = false;

// 1. Try Admin SDK
let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const rawData = process.env.FIREBASE_SERVICE_ACCOUNT;
    const decoded = rawData.trim().startsWith('{') ? rawData : Buffer.from(rawData, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
  } catch (e) { console.error("Admin Auth Error"); }
} else {
  const localKeyPath = path.resolve(__dirname, '../firebase-key.json');
  if (fs.existsSync(localKeyPath)) serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
}

if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    dbInstance = admin.firestore();
    is_admin = true;
    console.log("✅ Firebase Admin initialized");
  } catch (e) {
    console.error("Failed to init Admin SDK:", e.message);
  }
}

if (!dbInstance) {
  const firebaseConfig = {
    apiKey: "AIzaSyDVt8kyfc9287MRRhCdzMfG74xUYeuMicY",
    authDomain: "fp-mail-system.firebaseapp.com",
    projectId: "fp-mail-system",
    storageBucket: "fp-mail-system.firebasestorage.app",
    messagingSenderId: "903639090956",
    appId: "1:903639090956:web:44c5132fd7b9cbe7a5ab29"
  };

  const app = initializeApp(firebaseConfig);
  const clientDb = getFirestore(app);
  
  // Fully chainable Query Shim
  class QueryShim {
    constructor(collRef, constraints = []) {
      this.collRef = collRef;
      this.constraints = constraints;
    }
    where(f, op, v) { return new QueryShim(this.collRef, [...this.constraints, where(f, op, v)]); }
    orderBy(f, d = 'asc') { return new QueryShim(this.collRef, [...this.constraints, orderBy(f, d)]); }
    limit(l) { return new QueryShim(this.collRef, [...this.constraints, limit(l)]); }
    async get() {
      const q = query(this.collRef, ...this.constraints);
      return getDocs(q);
    }
  }

  dbInstance = {
    collection: (name) => {
      const collRef = collection(clientDb, name);
      const shim = new QueryShim(collRef);
      return {
        doc: (id) => {
          const d = id ? doc(clientDb, name, id) : doc(collRef);
          return {
            set: (data, opts) => setDoc(d, data, opts),
            get: () => getDoc(d),
            update: (data) => updateDoc(d, data),
            delete: () => deleteDoc(d),
            ref: d
          };
        },
        add: (data) => addDoc(collRef, data),
        where: (f, op, v) => shim.where(f, op, v),
        orderBy: (f, d) => shim.orderBy(f, d),
        limit: (l) => shim.limit(l),
        get: () => shim.get()
      };
    },
    batch: () => {
      const b = writeBatch(clientDb);
      return {
        set: (ref, data, opts) => b.set(ref.ref || ref, data, opts),
        update: (ref, data) => b.update(ref.ref || ref, data),
        delete: (ref) => b.delete(ref.ref || ref),
        commit: () => b.commit()
      };
    }
  };
  console.log("⚠️  Firebase Client Shim active (fully chainable)");
}

export const db = dbInstance;
export const auth = is_admin ? admin.auth() : null;
export default admin;
