import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ImmortalSim',
  description: 'A text-based cultivation roguelite simulation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
