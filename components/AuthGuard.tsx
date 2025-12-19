'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface AuthGuardProps {
  children: ReactNode;
  /**
   * URL to redirect to after login (used when accessing protected page without auth)
   * Default: current page from browser location
   */
  returnUrl?: string;
  /**
   * If true, redirect already-authenticated users away from this page
   * Used for login/register pages where authenticated users should go to dashboard
   */
  redirectIfAuthenticated?: boolean;
}

/**
 * Centralized Authentication Guard Component
 *
 * Responsibilities:
 * 1. Wait for auth to be ready (prevents blank pages)
 * 2. Check authentication status
 * 3. Redirect unauthenticated users to login (with returnUrl)
 * 4. Redirect authenticated users away from login/register (if specified)
 * 5. Show loading state during auth check
 * 6. Prevent double redirects
 *
 * Usage:
 *
 * // Protect a page - only authenticated users can access
 * <AuthGuard returnUrl="/dashboard">
 *   <DashboardContent />
 * </AuthGuard>
 *
 * // Redirect authenticated users away (for login/register pages)
 * <AuthGuard redirectIfAuthenticated>
 *   <LoginForm />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  returnUrl,
  redirectIfAuthenticated = false,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuth();

  // Get the current page URL for returnUrl if not provided
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only redirect if auth is ready
    if (!authReady) return;

    // If this is a login/register page and user is already authenticated
    if (redirectIfAuthenticated && isAuthenticated) {
      router.push('/dashboard');
      return;
    }

    // If this is a protected page and user is NOT authenticated
    if (!redirectIfAuthenticated && !isAuthenticated) {
      const finalReturnUrl = returnUrl || window.location.pathname;
      router.push(`/login?returnUrl=${encodeURIComponent(finalReturnUrl)}`);
      return;
    }
  }, [authReady, isAuthenticated, router, returnUrl, redirectIfAuthenticated]);

  // 🔴 CRITICAL: Wait for auth to be ready before rendering anything
  // This prevents blank pages and flash of wrong content
  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4 text-3xl">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If redirecting authenticated users away, don't show content yet
  if (redirectIfAuthenticated && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-pulse mb-4 text-3xl">→</div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If protecting a page and user is not authenticated, show loading (redirect happening)
  if (!redirectIfAuthenticated && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-pulse mb-4 text-3xl">→</div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Auth check passed, render protected content
  return <>{children}</>;
}

/**
 * Variant for protecting entire pages
 * Wraps the entire page content
 *
 * Usage in page.tsx:
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedPage returnUrl="/dashboard">
 *       <h1>Dashboard</h1>
 *     </ProtectedPage>
 *   );
 * }
 */
export function ProtectedPage({
  children,
  returnUrl,
}: Omit<AuthGuardProps, 'redirectIfAuthenticated'>) {
  return <AuthGuard returnUrl={returnUrl}>{children}</AuthGuard>;
}

/**
 * Variant for public pages that should redirect authenticated users
 * Used for login/register pages
 *
 * Usage in page.tsx:
 * export default function LoginPage() {
 *   return (
 *     <PublicAuthPage>
 *       <LoginForm />
 *     </PublicAuthPage>
 *   );
 * }
 */
export function PublicAuthPage({ children }: Omit<AuthGuardProps, 'returnUrl' | 'redirectIfAuthenticated'>) {
  return <AuthGuard redirectIfAuthenticated>{children}</AuthGuard>;
}
