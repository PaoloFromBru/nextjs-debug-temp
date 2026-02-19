This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Email Verification

Account creation requires entering a code that is sent to the provided email
address. The API route `POST /api/sendVerificationEmail` now uses the
[Resend](https://resend.com/) service.

### Setup steps

1. Sign up for Resend and create an API key.
2. Add the following variable to `.env.local`:

```bash
RESEND_API_KEY=your-resend-api-key
```

When this value is present, the API route sends emails from
`MyCellar <noreply@resend.dev>` using the Resend API.

### Troubleshooting Resend authentication

If `POST /api/sendVerificationEmail` fails, verify that your `RESEND_API_KEY`
is valid and has permission to send emails. A missing or incorrect key will
cause a 401 error from Resend.

## Password Reset Emails

Password reset messages are also delivered with **Resend**. The API route
`POST /api/sendPasswordResetEmail` generates a Firebase reset link and sends it
using Resend.

### Setup steps

1. Follow the Resend setup above so `RESEND_API_KEY` is available.
2. Provide Firebase Admin credentials in `.env.local`:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Troubleshooting password reset

Errors from the endpoint usually mean the Firebase credentials or Resend API
key are missing or invalid. Check the server logs for details.
## Firebase Client Setup (Required)

Create a `.env.local` file with your Firebase web app credentials. These must be the **client** keys from your Firebase project settings (Web app):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...          # required
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...      # required
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...       # required
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...           # required
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

If any of the required variables are missing, the app will log an error and disable Firebase Auth/Firestore on the client to avoid runtime crashes (e.g. `auth/invalid-api-key`).

### Gemini Model Config (Optional)

```bash
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash            # optional; 2.0 IDs auto-map to 2.5
GEMINI_API_VERSION=v1beta                # or v1 when available
```
