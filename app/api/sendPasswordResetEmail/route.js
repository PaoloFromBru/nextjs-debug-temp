import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const runtime = 'nodejs';

function initAdmin() {
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
  const privateKey = rawKey;

  console.log('Loading Firebase Admin credentials', {
    projectIdExists: Boolean(projectId),
    clientEmailExists: Boolean(clientEmail),
    privateKeyLength: privateKey?.length,
  });

  console.debug('Loading Firebase Admin credentials', {
    projectIdExists: Boolean(projectId),
    clientEmailExists: Boolean(clientEmail),
    privateKeyLength: privateKey?.length,
  });

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin credentials not configured', {
      projectIdExists: Boolean(projectId),
      clientEmailExists: Boolean(clientEmail),
      privateKeyExists: Boolean(privateKey),
    });
    throw new Error('Firebase Admin credentials not configured.');
  }

  try {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.error('Failed to initialize Firebase Admin', err);
    throw err;
  }
}

export async function POST(request) {
  const { email } = await request.json();
  console.log('Password reset email request received', { email });

  if (!email) {
    return NextResponse.json({ error: 'Missing email.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  console.log('Loaded Resend environment', {
    apiKeyExists: Boolean(apiKey),
  });

  if (!apiKey) {
    return NextResponse.json({ error: 'Resend API key not configured.' }, { status: 500 });
  }

  try {
    initAdmin();
    const auth = getAuth();
    const link = await auth.generatePasswordResetLink(email);

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'MyCellar <noreply@mycellarapp.com>',
      to: email,
      subject: 'Password reset',
      text: `Click the link below to reset your password:\n\n${link}`,
    });
    console.log('Password reset email sent successfully');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending password reset email', err);
    return NextResponse.json(
      { error: `Failed to send email: ${err.message}` },
      { status: 500 }
    );
  }
}
