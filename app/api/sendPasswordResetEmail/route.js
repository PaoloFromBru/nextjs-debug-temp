import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function initAdmin() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
    console.debug('Firebase Admin initialized');
  } catch (err) {
    console.error('Failed to initialize Firebase Admin', err);
    throw err;
  }
}

export async function POST(request) {
  const { email } = await request.json();
  console.debug('Password reset email request received', { email });

  if (!email) {
    return NextResponse.json({ error: 'Missing email.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  console.debug('Loaded Resend environment', {
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
    console.debug('Password reset email sent successfully');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending password reset email', err);
    return NextResponse.json(
      { error: `Failed to send email: ${err.message}` },
      { status: 500 }
    );
  }
}
