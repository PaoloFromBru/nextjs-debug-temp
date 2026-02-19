import { NextResponse } from 'next/server';

// Defaults and helpers
const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_API_VERSION = (process.env.GEMINI_API_VERSION || 'v1beta').trim();

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
    const body = await request.json();

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
        // Generic safety net: retry with our default 2.5 flash
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
