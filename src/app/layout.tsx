import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import Header from '@/components/Header';
import { AIRPORTS } from '@/lib/airports';

export const metadata: Metadata = {
  title: 'Travel Hub',
  description: 'Plan trips with friends: flights, hotels, places, and a travel checklist.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <datalist id="airports">
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.city}
            </option>
          ))}
        </datalist>
        <AuthProvider>
          <Header />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
