// app/layout.jsx
import '../styles/globals.css'; // Adjust if your path differs

export const metadata = {
  title: 'My Wine Cellar',
  description: 'Track and explore your wine collection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
