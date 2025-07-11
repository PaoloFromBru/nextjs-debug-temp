import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export async function POST(request) {
  const { email, code } = await request.json();
  console.debug('Verification email request received', { email, code });

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailUser = process.env.GMAIL_USER || 'mycellarapplication@gmail.com';
  const redirectUri = process.env.NEXT_PUBLIC_URL;

  console.debug('Loaded OAuth2 environment', {
    clientIdExists: Boolean(clientId),
    clientSecretExists: Boolean(clientSecret),
    refreshTokenExists: Boolean(refreshToken),
    redirectUri,
  });

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: 'Gmail OAuth2 not configured.' },
      { status: 500 }
    );
  }
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  let accessToken;
  try {
    const tokenRes = await oAuth2Client.getAccessToken();
    accessToken = tokenRes.token;
    console.debug('Obtained access token');
  } catch (err) {
    console.error('Error acquiring access token', err);
    return NextResponse.json(
      { error: `Failed to acquire access token: ${err.message}` },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: gmailUser,
      clientId,
      clientSecret,
      refreshToken,
      accessToken
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

