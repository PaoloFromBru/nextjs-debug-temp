import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
  }

  const host = process.env.EMAIL_SERVER_HOST;
  const port = parseInt(process.env.EMAIL_SERVER_PORT || '587', 10);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !pass) {
    return NextResponse.json(
      { error: 'Email server not configured.' },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}`
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to send email: ${err.message}` },
      { status: 500 }
    );
  }
}

