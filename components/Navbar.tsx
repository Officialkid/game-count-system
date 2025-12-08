// components/Navbar.tsx
// FIXED: Now uses centralized auth context for consistent authentication state across app
// FIXED: Improved responsive layout, prevented text truncation, added dark mode support
// FIXED: Hydration error by checking auth only on client-side
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PreferencesMenu } from './PreferencesMenu';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const isPublicPage = pathname?.startsWith('/public/');

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          {/* Logo - Always visible, responsive sizing */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="text-xl sm:text-2xl" aria-label="Game icon">🎮</span>
            <span className="text-base sm:text-lg md:text-xl font-bold text-primary-700 whitespace-nowrap">
              <span className="hidden xs:inline">Game Count</span>
              <span className="inline xs:hidden">GC</span>
            </span>
          </Link>

          {/* Navigation Links - Responsive with icons on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-shrink-0">
            {isLoading ? (
              // Show loading state while checking authentication
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
            ) : isPublicPage ? (
              <Link
                href="/"
                className="px-2 sm:px-3 py-2 text-sm sm:text-base text-gray-700 hover:text-primary-700 transition-colors whitespace-nowrap"
                aria-label="Go to home"
              >
                <span className="hidden sm:inline">Home</span>
                <span className="inline sm:hidden">🏠</span>
              </Link>
            ) : isAuthenticated ? (
              <>
                {/* User greeting */}
                <span className="hidden md:inline px-3 py-2 text-sm text-gray-600 font-medium">
                  {user?.name || 'User'}
                </span>
                <Link
                  href="/dashboard"
                  className={`px-2 sm:px-3 py-2 text-sm sm:text-base transition-colors whitespace-nowrap ${
                    pathname === '/dashboard'
                      ? 'text-primary-700 font-semibold'
                      : 'text-gray-700 hover:text-primary-700'
                  }`}
                  aria-label="Go to dashboard"
                  aria-current={pathname === '/dashboard' ? 'page' : undefined}
                >
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="inline sm:hidden">📊</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 sm:px-3 py-2 text-sm sm:text-base text-gray-700 hover:text-red-600 transition-colors whitespace-nowrap"
                  aria-label="Logout"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="inline sm:hidden">🚪</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('onboarding:start'))}
                  className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors whitespace-nowrap"
                  aria-label="Launch guided tutorial"
                >
                  Tutorial
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 sm:px-3 py-2 text-sm sm:text-base text-gray-700 hover:text-primary-700 transition-colors whitespace-nowrap"
                  aria-label="Login to account"
                >
                  <span className="hidden sm:inline">Login</span>
                  <span className="inline sm:hidden">🔑</span>
                </Link>
                <Link
                  href="/register"
                  className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap font-medium shadow-sm"
                  aria-label="Create new account"
                >
                  <span className="hidden sm:inline">Sign Up</span>
                  <span className="inline sm:hidden">✨</span>
                </Link>
              </>
            )}
            
            {/* Preferences Menu */}
            <PreferencesMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
