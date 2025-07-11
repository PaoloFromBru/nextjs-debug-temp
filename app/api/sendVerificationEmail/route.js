import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  const { email, code } = await request.json();
  console.debug('Verification email request received', { email, code });

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
  }

  const gmailUser = process.env.GMAIL_USER || 'mycellarapplication@gmail.com';
  const appPassword = process.env.GMAIL_APP_PASSWORD;

  console.debug('Loaded SMTP environment', {
    user: gmailUser,
    appPasswordExists: Boolean(appPassword),
  });

  if (!appPassword) {
    return NextResponse.json(
      { error: 'Gmail app password not configured.' },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: appPassword,
    }
  });

  console.debug('Nodemailer transporter configured for Gmail');

  try {
    console.debug('Sending verification email to', email);
    await transporter.sendMail({
      from: `MyCellar <${gmailUser}>`,
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}`
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

