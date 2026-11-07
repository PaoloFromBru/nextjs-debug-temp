import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

// Defaults and helpers
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_API_VERSION = (process.env.GEMINI_API_VERSION || 'v1beta').trim();
const MAX_CONTENT_LENGTH_BYTES = 6_000_000;
const MAX_CONTENTS = 4;
const MAX_PARTS_PER_CONTENT = 4;
const MAX_TEXT_LENGTH = 8_000;
const MAX_INLINE_DATA_LENGTH = 4_500_000;
const ALLOWED_INLINE_MIME_TYPES = ['image/jpeg', 'image/png'];
// Always enforced server-side; the caller can never loosen these, since that
// would let anyone with our API key generate content Google's safety system
// would otherwise block, which is what gets an API key/project suspended.
const ENFORCED_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

function initFirebaseAdmin() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (rawKey && rawKey.includes('\\n')) {
    rawKey = rawKey.replace(/\\n/g, '\n');
  }
  if (rawKey && !rawKey.includes('BEGIN')) {
    try {
      rawKey = Buffer.from(rawKey, 'base64').toString('utf8');
    } catch (err) {
      console.error('Failed to decode FIREBASE_PRIVATE_KEY', err);
    }
  }

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error('Firebase Admin credentials not configured.');
  }

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey: rawKey }) });
}

// Requires the caller to be a signed-in user of this app, so the Gemini
// proxy can't be used as a free, unauthenticated gateway to our API key.
async function requireUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) return null;

  try {
    initFirebaseAdmin();
    return await getAuth().verifyIdToken(match[1]);
  } catch (err) {
    console.error('Gemini proxy: failed to verify caller', err?.message || err);
    return null;
  }
}

// Only forward a request shape we expect, with our own safety settings.
// Never trust the caller's `contents` or `safetySettings` verbatim: an
// attacker who found this endpoint could otherwise send arbitrary prompts/
// images, or disable the safety filters, using our Gemini API key.
function sanitizeBody(rawBody) {
  if (!rawBody || !Array.isArray(rawBody.contents)) return null;
  if (rawBody.contents.length === 0 || rawBody.contents.length > MAX_CONTENTS) return null;

  const contents = [];
  for (const entry of rawBody.contents) {
    if (!entry || entry.role !== 'user' || !Array.isArray(entry.parts)) return null;
    if (entry.parts.length === 0 || entry.parts.length > MAX_PARTS_PER_CONTENT) return null;

    const parts = [];
    for (const part of entry.parts) {
      if (part && typeof part.text === 'string') {
        if (part.text.length > MAX_TEXT_LENGTH) return null;
        parts.push({ text: part.text });
        continue;
      }
      if (part && part.inlineData && typeof part.inlineData.data === 'string') {
        if (part.inlineData.data.length > MAX_INLINE_DATA_LENGTH) return null;
        if (!ALLOWED_INLINE_MIME_TYPES.includes(part.inlineData.mimeType)) return null;
        parts.push({ inlineData: { mimeType: part.inlineData.mimeType, data: part.inlineData.data } });
        continue;
      }
      return null;
    }

    contents.push({ role: 'user', parts });
  }

  return { contents, safetySettings: ENFORCED_SAFETY_SETTINGS };
}

function normalizeAndMapModel(envModel) {
  let raw = typeof envModel === 'string' ? envModel.trim() : '';
  const defaulted = !raw;
  if (!raw) raw = DEFAULT_MODEL;

  const originalModel = raw;
  const lower = raw.toLowerCase();

  let effectiveModel = lower;
  let mappingApplied = false;

  if (lower.startsWith('gemini-2.0-flash-lite')) {
    effectiveModel = 'gemini-2.5-flash-lite';
    mappingApplied = true;
  } else if (lower.startsWith('gemini-2.0-flash')) {
    effectiveModel = 'gemini-2.5-flash';
    mappingApplied = true;
  }

  return { originalModel, effectiveModel, mappingApplied, defaulted };
}

function buildUrl(model, apiKey, version = DEFAULT_API_VERSION) {
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
}

export async function GET() {
  const { originalModel, effectiveModel, mappingApplied, defaulted } = normalizeAndMapModel(
    process.env.GEMINI_MODEL,
  );

  const payload = {
    apiVersion: DEFAULT_API_VERSION,
    originalModel: originalModel || null,
    effectiveModel,
    mappingApplied,
    defaulted,
  };

  const res = NextResponse.json(payload, { status: 200 });
  res.headers.set('cache-control', 'no-store');
  return res;
}

export async function POST(request) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_CONTENT_LENGTH_BYTES) {
    return NextResponse.json({ error: 'Request payload too large.' }, { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing Gemini API key in environment variables.' },
      { status: 500 },
    );
  }

  const { originalModel, effectiveModel, mappingApplied } = normalizeAndMapModel(
    process.env.GEMINI_MODEL,
  );

  const url = buildUrl(effectiveModel, apiKey);

  try {
    const rawBody = await request.json();
    const body = sanitizeBody(rawBody);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    // First attempt with the chosen/effective model
    let geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // On model deprecation/unknown model, try a resilient fallback once
    if (!geminiRes.ok && (geminiRes.status === 400 || geminiRes.status === 404)) {
      let fallbackModel = null;

      // If the env asked for a 2.0 flash variant (any suffix), fallback to 2.5 equivalents
      const origLower = (originalModel || '').toLowerCase();
      if (origLower.startsWith('gemini-2.0-flash-lite')) {
        fallbackModel = 'gemini-2.5-flash-lite';
      } else if (origLower.startsWith('gemini-2.0-flash')) {
        fallbackModel = 'gemini-2.5-flash';
      } else if (!mappingApplied) {
        // Generic safety net: retry with our default model
        fallbackModel = DEFAULT_MODEL;
      }

      if (fallbackModel && fallbackModel !== effectiveModel) {
        const fallbackUrl = buildUrl(fallbackModel, apiKey);
        const retryRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const res = NextResponse.json(retryData, { status: 200 });
          res.headers.set('x-gemini-model', fallbackModel);
          res.headers.set('x-gemini-fallback', 'true');
          res.headers.set('x-gemini-api-version', DEFAULT_API_VERSION);
          res.headers.set('cache-control', 'no-store');
          return res;
        }
      }
    }

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      return NextResponse.json({ error: `Gemini API Error: ${errorText}` }, { status: geminiRes.status });
    }

    const data = await geminiRes.json();
    const res = NextResponse.json(data, { status: 200 });
    res.headers.set('x-gemini-model', effectiveModel);
    res.headers.set('x-gemini-fallback', 'false');
    res.headers.set('x-gemini-api-version', DEFAULT_API_VERSION);
    res.headers.set('cache-control', 'no-store');
    return res;
  } catch (err) {
    return NextResponse.json({ error: `Proxy Error: ${err.message}` }, { status: 500 });
  }
}
