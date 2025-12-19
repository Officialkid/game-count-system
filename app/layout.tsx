// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './animations.css';
import './globals-enhanced.css';
import './mobile-optimized.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/lib/auth-context';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import { ClientSetup } from '@/components/ClientSetup';

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
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <OnboardingTutorial />
              {/* flex-1 makes main content grow to push footer to bottom */}
              <main className="flex-1">
                {children}
              </main>
              <footer className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white py-16 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-400 to-amber-400 flex items-center justify-center">
                          <span className="text-lg font-bold text-purple-900">GS</span>
                        </div>
                        <span className="text-xl font-bold">GameScore</span>
                      </div>
                      <p className="text-sm text-purple-200">The ultimate scoring platform for competitions, tournaments, and events.</p>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Product</h3>
                      <ul className="space-y-2 text-sm text-purple-200">
                        <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                        <li><a href="/events" className="hover:text-white transition-colors">Events</a></li>
                        <li><a href="/register" className="hover:text-white transition-colors">Sign Up</a></li>
                      </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Legal</h3>
                      <ul className="space-y-2 text-sm text-purple-200">
                        <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                        <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                        <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                        <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                      </ul>
                    </div>

                    {/* Contact & Social */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Get in Touch</h3>
                      <ul className="space-y-2 text-sm text-purple-200">
                        <li><a href="mailto:support@gamescore.app" className="hover:text-white transition-colors">support@gamescore.app</a></li>
                        <li><a href="tel:+254745169345" className="hover:text-white transition-colors">+254 745 169 345</a></li>
                      </ul>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-purple-700 pt-8">
                    <p className="text-center text-sm text-purple-300">© 2025 GameScore. All rights reserved.</p>
                  </div>
                </div>
              </footer>
            </ToastProvider>
          </AuthProvider>
        </ClientSetup>
      </body>
    </html>
  );
}
