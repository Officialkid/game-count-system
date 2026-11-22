import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals-enhanced.css';
import './animations.css';
import './mobile-optimized.css';
import { PwaManager } from '@/components/PwaManager';

export const metadata: Metadata = {
  title: 'GamesCo — Live Event & Camp Scoreboard',
  description:
    'Offline-ready live scoring and public scoreboard for camps, tournaments, and multi-day events. No sign-up required.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GamesCo',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
            },
          }}
        />
        <PwaManager />
      </body>
    </html>
  );
}
