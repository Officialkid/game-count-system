/**
 * components/ProtectedRoute.tsx
 * 
 * ⚠️ DEPRECATED: Use AuthGuard from '@/components/AuthGuard' instead
 * 
 * This component has been superseded by the centralized AuthGuard component.
 * AuthGuard provides the same functionality with better code organization and consistency.
 * 
 * Migration guide:
 * OLD: import { ProtectedRoute } from '@/components/ProtectedRoute';
 * NEW: import { ProtectedPage } from '@/components/AuthGuard';
 * 
 * OLD: <ProtectedRoute>{children}</ProtectedRoute>
 * NEW: <ProtectedPage>{children}</ProtectedPage>
 * 
 * This file will be removed in a future release.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component (DEPRECATED)
 * 
 * Handles authentication checking and redirects for protected pages.
 * Eliminates need for manual auth checks in each page.
 * 
 * Features:
 * - Waits for auth check to complete before rendering
 * - Shows fallback UI while checking auth
 * - Redirects unauthenticated users to login
 * - Passes returnUrl for post-login redirect
 * - Single point of control for route protection
 * 
 * Props:
 * - children: Content to render when authenticated
 * - fallback: Content to show while checking auth (default: loading spinner)
 * - redirectTo: Path to redirect to on auth failure (default: /login)
 */
export function ProtectedRoute({
  children,
  fallback = <DefaultLoadingFallback />,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Step 1: Wait for auth check to complete
    if (isLoading) {
      return;
    }

    // Step 2: Redirect if not authenticated
    if (!isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const returnUrl = currentPath ? `?returnUrl=${encodeURIComponent(currentPath)}` : '';
      router.push(`${redirectTo}${returnUrl}`);
    }
    // Step 3: Authenticated - will render children below
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // ✅ Show fallback while checking auth
  if (isLoading) {
    return fallback;
  }

  // ✅ Show fallback if not authenticated (brief moment before redirect)
  if (!isAuthenticated) {
    return fallback;
  }

  // ✅ Render protected content
  return children;
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-amber-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Alternative: Loading skeleton for specific page types
 */
export function DashboardLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-amber-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8 mt-20">
        <div className="mb-8 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Loading skeleton for event pages
 */
export function EventLoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="mt-8 h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
