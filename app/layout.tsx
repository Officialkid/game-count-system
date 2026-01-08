// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './animations.css';
import './globals-enhanced.css';
import './mobile-optimized.css';
import { ToastProvider } from '@/components/ui';
import { ClientSetup } from '@/components/ClientSetup';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Game Count System - Event Scoring & Leaderboards',
  description: 'Professional multi-team, multi-event scoring system with real-time public scoreboards',
  keywords: 'scoring, events, teams, leaderboard, competition, games',
  authors: [{ name: 'Game Count System' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Game Count System',
    description: 'Track team scores and share live scoreboards',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <ClientSetup>
          <ToastProvider>
            <main className="flex-1">
              {children}
            </main>
            
            {/* Simplified Footer */}
            <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 mt-16 border-t border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                  
                  {/* Who We Are */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-purple-400">Who We Are</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      We provide professional event scoring and team management solutions 
                      for competitions, camps, and tournaments of all sizes.
                    </p>
                  </div>
                  
                  {/* Designed By */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-purple-400">Designed By</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">AT</span>
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        AlphaTech
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Innovative solutions for modern challenges
                    </p>
                  </div>
                  
                  {/* Contact */}
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-purple-400">Contact Us</h3>
                    <div className="space-y-2">
                      <a 
                        href="tel:+254745169345" 
                        className="flex items-center justify-center md:justify-start gap-2 text-gray-300 hover:text-white transition-colors group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">📞</span>
                        <span className="text-sm font-medium">0745 169 345</span>
                      </a>
                      <a 
                        href="https://wa.me/254745169345" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center md:justify-start gap-2 text-green-400 hover:text-green-300 transition-colors group"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
                        <span className="text-sm font-medium">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  
                </div>
                
                {/* Copyright */}
                <div className="border-t border-gray-700 mt-8 pt-6 text-center">
                  <p className="text-xs text-gray-400">
                    © {new Date().getFullYear()} AlphaTech. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
            
            {/* WhatsApp Floating Button */}
            <WhatsAppButton />
          </ToastProvider>
        </ClientSetup>
      </body>
    </html>
  );
}
