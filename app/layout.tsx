// app/layout.tsx
import type { Metadata } from 'next';
import './globals-enhanced.css';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/ui';
import { ThemeProvider } from '@/contexts/ThemeContext';

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
      {/* suppressHydrationWarning prevents dark mode hydration mismatch */}
      <body className="antialiased flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            {/* flex-1 makes main content grow to push footer to bottom */}
            <main className="flex-1">
              {children}
            </main>
            <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-6 mt-8">
              <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
                <p className="text-sm sm:text-base">
                  © 2025 Game Count System
                </p>
                <p className="text-xs sm:text-sm mt-2 text-gray-500 dark:text-gray-500">
                  Professional Event Scoring Platform
                </p>
              </div>
            </footer>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
