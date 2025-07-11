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
address. The API route `POST /api/sendVerificationEmail` now uses a Gmail App
Password for authentication.

### Setup steps

1. Enable two-factor authentication for your Gmail account and generate an App
   Password for "Mail".
2. Create `.env.local` with the variables below:

```bash
GMAIL_USER=mycellarapplication@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

When these values are present, the API route sends emails from the Gmail
account using SMTP.

### Troubleshooting Gmail authentication

If `POST /api/sendVerificationEmail` fails with an error such as:

```
Failed to send email: Invalid login: 535-5.7.8 Username and Password not accepted
```

verify that your `.env.local` contains the correct `GMAIL_APP_PASSWORD` for the
account specified by `GMAIL_USER`. Using an incorrect or revoked password will
lead to this 535 error from Gmail.
