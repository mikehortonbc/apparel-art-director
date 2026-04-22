import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apparel Art Director',
  description: 'A complete Next.js app for curating apparel art direction concepts.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
