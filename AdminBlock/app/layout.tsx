import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdminBlock - Admin Dashboard',
  description: 'Admin-only dashboard for BlockStop operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-admin-bg text-admin-text antialiased">
        {children}
      </body>
    </html>
  );
}
