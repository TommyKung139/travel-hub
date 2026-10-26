import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import AirportDatalist from '@/components/AirportDatalist';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Travel Hub',
  description: 'Plan trips with friends: flights, hotels, places, and a travel checklist. 和朋友一起規劃旅行。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AirportDatalist />
          <AuthProvider>
            <Header />
            <main className="container">{children}</main>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
