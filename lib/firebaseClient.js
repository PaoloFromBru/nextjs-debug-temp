// lib/firebaseClient.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function hasRequiredClientConfig(cfg) {
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

// Prevent re-initializing; guard against missing client config in dev
let app;
let authInstance = null;
let dbInstance = null;

if (hasRequiredClientConfig(firebaseConfig)) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  } catch (e) {
    console.error('[Firebase] Failed to initialize app:', e?.message || e);
  }

  if (app) {
    try {
      authInstance = getAuth(app);
    } catch (e) {
      console.error('[Firebase] Auth initialization failed (check NEXT_PUBLIC_FIREBASE_API_KEY):', e?.message || e);
      authInstance = null;
    }
    try {
      dbInstance = getFirestore(app);
    } catch (e) {
      console.error('[Firebase] Firestore initialization failed:', e?.message || e);
      dbInstance = null;
    }
  }
} else {
  // Provide a clear, non-fatal diagnostic to help local setup
  // Avoid throwing so the app can render and surface errors gracefully
  // eslint-disable-next-line no-console
  console.error('[Firebase] Missing required NEXT_PUBLIC_* env vars. Expected NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID');
}

export const auth = authInstance;
export const db = dbInstance;


// Optional: enable offline persistence once
if (db) {
  enableIndexedDbPersistence(db).catch((err) => {
    console.debug("Could not enable persistence:", err.code);
  });
}
