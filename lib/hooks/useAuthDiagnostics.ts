"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { account } from '@/lib/appwrite';

export type AuthDiagnostics = {
  isLoading: boolean;
  authReady: boolean;
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  sessionActive: boolean | null;
  localTokenPresent: boolean;
  refresh: () => Promise<void>;
};

export function useAuthDiagnostics(): AuthDiagnostics {
  const { isLoading, authReady, isAuthenticated, user } = useAuth();
  const [sessionActive, setSessionActive] = useState<boolean | null>(null);
  const [localTokenPresent, setLocalTokenPresent] = useState<boolean>(false);

  const checkSession = useCallback(async () => {
    try {
      await account.get();
      setSessionActive(true);
    } catch {
      setSessionActive(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const anyToken = !!(localStorage.getItem('token') || localStorage.getItem('auth_token'));
      setLocalTokenPresent(anyToken);
    }
    await checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Initial probe
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Log state changes to console for debugging
    // eslint-disable-next-line no-console
    console.debug('[AuthDiagnostics]', {
      isLoading,
      authReady,
      isAuthenticated,
      user,
      sessionActive,
      localTokenPresent,
    });
  }, [isLoading, authReady, isAuthenticated, user, sessionActive, localTokenPresent]);

  return useMemo(
    () => ({ isLoading, authReady, isAuthenticated, user, sessionActive, localTokenPresent, refresh }),
    [isLoading, authReady, isAuthenticated, user, sessionActive, localTokenPresent, refresh]
  );
}
