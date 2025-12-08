// app/layout.tsx
import type { Metadata } from 'next';
import './globals-enhanced.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/lib/auth-context';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';

export const metadata: Metadata = {
  title: 'Game Count System - Event Scoring & Leaderboards',
  description: 'Professional multi-team, multi-event scoring system with real-time public scoreboards',
  keywords: 'scoring, events, teams, leaderboard, competition, games',
  authors: [{ name: 'Game Count System' }],
  openGraph: {
    title: 'Game Count System',
    description: 'Track team scores and share live scoreboards',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <OnboardingTutorial />
            {/* flex-1 makes main content grow to push footer to bottom */}
            <main className="flex-1">
              {children}
            </main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-8 text-gray-700">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-sm sm:text-base font-semibold text-primary-700">© 2025 Game Count System</p>
              <p className="text-xs sm:text-sm mt-2 text-gray-600">Professional Event Scoring Platform</p>
            </div>
          </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
