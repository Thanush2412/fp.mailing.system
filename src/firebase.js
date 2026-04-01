import admin from 'firebase-admin';

// On Vercel, we will use an environment variable for the service account JSON
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : null;

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else if (!admin.apps.length) {
  // Fallback for local development if the file exists
  // Or it will throw an error when attempting to use Firestore
  console.warn("FIREBASE_SERVICE_ACCOUNT not found. Firestore will not work.");
}

export const db = admin.apps.length ? admin.firestore() : null;
export const auth = admin.apps.length ? admin.auth() : null;
export default admin;
