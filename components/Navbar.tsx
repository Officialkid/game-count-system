// components/Navbar.tsx
// FIXED: Improved responsive layout, prevented text truncation, added dark mode support (UI-DEBUG-REPORT Issue #8)
// FIXED: Added dark mode toggle (UI-DEBUG-REPORT Issue #13)
// FIXED: Hydration error by checking auth only on client-side
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/api-client';
import { ThemeToggle } from './ThemeToggle';
import { PreferencesMenu } from './PreferencesMenu';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isPublicPage = pathname?.startsWith('/public/');

  // Only check authentication after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    setIsAuthenticated(auth.isAuthenticated());
  }, []);

  const handleLogout = () => {
    auth.removeToken();
    router.push('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          {/* Logo - Always visible, responsive sizing */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="text-xl sm:text-2xl" aria-label="Game icon">🎮</span>
            <span className="text-base sm:text-lg md:text-xl font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
              <span className="hidden xs:inline">Game Count</span>
              <span className="inline xs:hidden">GC</span>
            </span>
          </Link>

          {/* Navigation Links - Responsive with icons on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* Dark Mode Toggle */}
            <ThemeToggle />
            
            {!isClient ? (
              // Show loading state during hydration to prevent mismatch
              <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : isPublicPage ? (
              <Link
                href="/"
                className="px-2 sm:px-3 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap"
                aria-label="Go to home"
              >
                <span className="hidden sm:inline">Home</span>
                <span className="inline sm:hidden">🏠</span>
              </Link>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`px-2 sm:px-3 py-2 text-sm sm:text-base transition-colors whitespace-nowrap ${
                    pathname === '/dashboard'
                      ? 'text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                  aria-label="Go to dashboard"
                  aria-current={pathname === '/dashboard' ? 'page' : undefined}
                >
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="inline sm:hidden">📊</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 sm:px-3 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap"
                  aria-label="Logout"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="inline sm:hidden">🚪</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 sm:px-3 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap"
                  aria-label="Login to account"
                >
                  <span className="hidden sm:inline">Login</span>
                  <span className="inline sm:hidden">🔑</span>
                </Link>
                <Link
                  href="/register"
                  className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors whitespace-nowrap font-medium"
                  aria-label="Create new account"
                >
                  <span className="hidden sm:inline">Sign Up</span>
                  <span className="inline sm:hidden">✨</span>
                </Link>
              </>
            )}
            
            {/* Preferences Menu */}
            {isClient && <PreferencesMenu />}
            
            {/* Theme Toggle */}
            {isClient && <ThemeToggle />}
          </div>
        </div>
      </div>
    </nav>
  );
}
