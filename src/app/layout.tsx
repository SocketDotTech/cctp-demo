import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CCTP Token Transfer Demo',
  description: 'Demo app for cross-chain token transfers using Socket and CCTP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 