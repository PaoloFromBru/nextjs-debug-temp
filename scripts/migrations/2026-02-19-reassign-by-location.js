'use strict';

// Optional helper: reassign wines to cellars based on a CSV mapping of location->cellarId
// Input file: scripts/migrations/location-to-cellar.csv with lines: location,cellarId

const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function loadEnvLocal() {
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

function readMapping() {
  const file = path.join(process.cwd(), 'scripts/migrations/location-to-cellar.csv');
  if (!fs.existsSync(file)) return {};
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const map = {};
  for (const row of rows) {
    const [loc, cellar] = row.split(',').map((s) => s.trim().toLowerCase());
    if (loc && cellar) map[loc] = cellar;
  }
  return map;
}

async function main() {
  initAdmin();
  const db = getFirestore();
  const appId = process.env.APP_ID || process.env.npm_package_config_appId;
  if (!appId) throw new Error('Missing APP_ID');
  const map = readMapping();
  if (!Object.keys(map).length) {
    console.log('No mapping file found or empty. Skip.');
    return;
  }

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
        const loc = String(data.location || '').trim().toLowerCase();
        const dest = map[loc];
        if (dest) {
          batch.update(d.ref, { cellarId: dest });
          updated += 1;
        }
      });
      if (updated) await batch.commit();
      console.log(`user=${userId} ${col} reassigned=${updated}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

