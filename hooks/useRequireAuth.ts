/**
 * hooks/useRequireAuth.ts
 * 
 * Custom hook for protecting components that require authentication.
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isChecking, isAuthed } = useRequireAuth();
 *   
 *   if (isChecking) return <Loading />;
 *   if (!isAuthed) return null; // Will redirect automatically
 *   
 *   return <ProtectedContent />;
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface UseRequireAuthOptions {
  redirectTo?: string;
  redirectDelay?: number;
}

/**
 * Hook to protect components with authentication
 * 
 * Returns:
 * - isChecking: true while auth check is in progress
 * - isAuthed: true if user is authenticated
 * - user: authenticated user data
 * 
 * Features:
 * - Automatically redirects to login if not authenticated
 * - Respects returnUrl for post-login redirect
 * - Single hook for auth protection
 * - No duplicate checks needed
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const {
    redirectTo = '/login',
    redirectDelay = 0,
  } = options;

  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Step 1: Wait for auth check
    if (isLoading) {
      return;
    }

    // Step 2: Redirect if not authenticated
    if (!isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const returnUrl = currentPath ? `?returnUrl=${encodeURIComponent(currentPath)}` : '';
      
      // Use delay if needed (e.g., for animations)
      if (redirectDelay > 0) {
        const timeout = setTimeout(() => {
          router.push(`${redirectTo}${returnUrl}`);
        }, redirectDelay);
        return () => clearTimeout(timeout);
      }
      
      router.push(`${redirectTo}${returnUrl}`);
    }
  }, [isLoading, isAuthenticated, router, redirectTo, redirectDelay]);

  return {
    isChecking: isLoading,
    isAuthed: isAuthenticated && !isLoading,
    user,
  };
}
