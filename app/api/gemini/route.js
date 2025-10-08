import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing Gemini API key in environment variables.' },
      { status: 500 }
    );
  }

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash-002';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const body = await request.json();
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini API Error: ${errorText}` },
        { status: geminiRes.status }
      );
    }

    const data = await geminiRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: `Proxy Error: ${err.message}` },
      { status: 500 }
    );
  }
}
