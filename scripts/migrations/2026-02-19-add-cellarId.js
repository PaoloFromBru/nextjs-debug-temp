'use strict';

const fs = require('fs');
const path = require('path');

// Adds a `cellarId` field to all wines/experiencedWines that are missing it.
// Usage: set APP_ID env (or via npm config) and run:
//   node scripts/migrations/2026-02-19-add-cellarId.js

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function loadEnvLocal() {
  // Load .env.local into process.env if present
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function initAdmin() {
  loadEnvLocal();
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in env.');
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function main() {
  initAdmin();
  const db = getFirestore();
  const appId = process.env.APP_ID || process.env.npm_package_config_appId;
  if (!appId) throw new Error('Missing APP_ID');

  const usersSnap = await db.collection(`artifacts/${appId}/users`).get();
  console.log('Users:', usersSnap.size);
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    for (const col of ['wines', 'experiencedWines']) {
      const colRef = db.collection(`artifacts/${appId}/users/${userId}/${col}`);
      const snap = await colRef.get();
      let updated = 0;
      const batch = db.batch();
      snap.forEach((d) => {
        const data = d.data() || {};
        if (!('cellarId' in data)) {
          batch.update(d.ref, { cellarId: 'default' });
          updated += 1;
        }
      });
      if (updated) await batch.commit();
      console.log(`user=${userId} ${col} updated=${updated}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
