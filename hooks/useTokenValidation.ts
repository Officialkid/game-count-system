/**
 * React Hook for Token Validation
 * Use this in client components to validate tokens and check permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TokenType, TokenPermissions, extractToken } from '@/lib/token-utils';

interface TokenValidationState {
  isValidating: boolean;
  isValid: boolean;
  tokenType: TokenType | null;
  permissions: TokenPermissions | null;
  token: string | null;
  error: string | null;
}

/**
 * Hook to validate token from URL and get permissions
 */
export function useTokenValidation(eventId: string) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<TokenValidationState>({
    isValidating: true,
    isValid: false,
    tokenType: null,
    permissions: null,
    token: null,
    error: null,
  });

  useEffect(() => {
    async function validateToken() {
      try {
        // Extract token from URL
        const token = extractToken(searchParams);

        if (!token) {
          setState({
            isValidating: false,
            isValid: false,
            tokenType: null,
            permissions: null,
            token: null,
            error: 'No access token provided',
          });
          return;
        }

        // Call validation API
        const response = await fetch(`/api/events/${eventId}/validate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!data.success) {
          setState({
            isValidating: false,
            isValid: false,
            tokenType: null,
            permissions: null,
            token,
            error: data.error || 'Invalid token',
          });
          return;
        }

        setState({
          isValidating: false,
          isValid: true,
          tokenType: data.data.tokenType,
          permissions: data.data.permissions,
          token,
          error: null,
        });
      } catch (error) {
        setState({
          isValidating: false,
          isValid: false,
          tokenType: null,
          permissions: null,
          token: null,
          error: 'Failed to validate token',
        });
      }
    }

    validateToken();
  }, [eventId, searchParams]);

  return state;
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(
  permissions: TokenPermissions | null,
  permission: keyof TokenPermissions
): boolean {
  return permissions?.[permission] === true;
}
