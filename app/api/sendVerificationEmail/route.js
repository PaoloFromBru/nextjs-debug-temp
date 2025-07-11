import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request) {
  const { email, code } = await request.json();
  console.debug('Verification email request received', { email, code });

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  console.debug('Loaded Resend environment', {
    apiKeyExists: Boolean(apiKey),
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Resend API key not configured.' },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  console.debug('Resend client configured');

  try {
    console.debug('Sending verification email to', email);
    await resend.emails.send({
      from: 'MyCellar <noreply@mycellarapp.com>',
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}`,
    });
    console.debug('Verification email sent successfully');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending verification email', err);
    return NextResponse.json(
      { error: `Failed to send email: ${err.message}` },
      { status: 500 }
    );
  }
}

