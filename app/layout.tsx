import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ImmortalSim',
  description: 'A text-based cultivation roguelite simulation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
