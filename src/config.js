import db from './db.js';

export const config = {
  getScripts: async () => {
    if (!db) return [];
    const snapshot = await db.collection('mail_configs').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  getActiveId: async () => {
    if (!db) return null;
    const snapshot = await db.collection('mail_configs').where('is_active', '==', 1).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  },

  getActiveScript: async () => {
    if (!db) return null;
    let snapshot = await db.collection('mail_configs').where('is_active', '==', 1).limit(1).get();
    
    if (snapshot.empty) {
      // Fallback: get any config
      snapshot = await db.collection('mail_configs').limit(1).get();
      if (!snapshot.empty) {
        const active = snapshot.docs[0];
        await db.collection('mail_configs').doc(active.id).update({ is_active: 1 });
        return { id: active.id, ...active.data() };
      }
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
}
