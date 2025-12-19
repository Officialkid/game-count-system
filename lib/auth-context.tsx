'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentUser as awGetCurrentUser,
  login as awLogin,
  logout as awLogout,
  register as awRegister,
  startPasswordRecovery as awStartPasswordRecovery,
  completePasswordRecovery as awCompletePasswordRecovery,
  loginWithGoogle as awLoginWithGoogle,
} from './appwriteAuth';

const USE_APPWRITE = true;

function readCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookieToken(token: string | null) {
  if (typeof document === 'undefined') return;
  if (!token) {
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
  } else {
    document.cookie = `token=${encodeURIComponent(token)}; Max-Age=${60 * 60 * 24 * 7}; path=/; SameSite=Lax`;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  authReady: boolean; // 🔴 CRITICAL: Wait for this before making API calls
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  startPasswordRecovery: (email: string) => Promise<void>;
  completePasswordRecovery: (userId: string, secret: string, newPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined) as React.Context<AuthContextType | undefined>;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false); // 🔴 CRITICAL: Wait for this before making API calls
  const isMountedRef = useRef(false); // Prevent double-initialization

  // Initialize auth state on app startup
  const checkAuth = useCallback(async () => {
    console.debug('[AUTH] Starting auth initialization');
    setIsLoading(true);
    try {
      // Appwrite session-based auth only
      console.debug('[AUTH] Calling account.get() to verify session...');
      const res = await awGetCurrentUser();
      
      if (res.success && res.data.user) {
        const current = res.data.user;
        console.debug('[AUTH] ✅ Session valid, user authenticated:', { userId: current.id, email: current.email });
        setUser({ id: current.id, name: current.name, email: current.email });
        setIsAuthenticated(true);
      } else {
        console.debug('[AUTH] ❌ No session or user data, unauthenticated');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AUTH] ❌ Error during session check:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      console.debug('[AUTH] ✅ Auth initialization complete, setting authReady=true');
      setIsLoading(false);
      setAuthReady(true); // 🔴 CRITICAL: Mark auth as ready, unblock components
    }
  }, []);

  // Check auth on mount (ONLY ONCE - prevents race conditions)
  useEffect(() => {
    // Prevent double initialization (React StrictMode, etc.)
    if (isMountedRef.current) return;
    isMountedRef.current = true;

    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    console.debug('[AUTH] Login attempt for:', email);
    setIsLoading(true);
    try {
      const res = await awLogin(email, password);
      if (!res.success) {
        console.error('[AUTH] ❌ Login failed:', res.error);
        throw new Error(res.error || 'Login failed');
      }
      const u = res.data.user!;
      console.debug('[AUTH] ✅ Login successful, user:', { userId: u.id, email: u.email });
      setUser({ id: u.id, name: u.name, email: u.email });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('[AUTH] ❌ Login error:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    console.debug('[AUTH] Register attempt for:', email);
    setIsLoading(true);
    try {
      const res = await awRegister(name, email, password);
      if (!res.success) {
        console.error('[AUTH] ❌ Registration failed:', res.error);
        throw new Error(res.error || 'Registration failed');
      }
      const u = res.data.user!;
      console.debug('[AUTH] ✅ Registration successful, user:', { userId: u.id, email: u.email });
      setUser({ id: u.id, name: u.name, email: u.email });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('[AUTH] ❌ Registration error:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.debug('[AUTH] Logout initiated');
    try {
      await awLogout();
      console.debug('[AUTH] ✅ Session deleted successfully');
    } catch (error) {
      console.error('[AUTH] ❌ Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      console.debug('[AUTH] ✅ Auth state cleared');
    }
  }, []);

  const startPasswordRecovery = useCallback(async (email: string) => {
    console.debug('[AUTH] Password recovery requested for:', email);
    setIsLoading(true);
    try {
      const res = await awStartPasswordRecovery(email);
      if (!res.success) {
        console.error('[AUTH] ❌ Password recovery failed:', res.error);
        throw new Error(res.error || 'Password recovery failed');
      }
      console.debug('[AUTH] ✅ Recovery email sent');
    } catch (error) {
      console.error('[AUTH] ❌ Password recovery error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completePasswordRecovery = useCallback(async (userId: string, secret: string, newPassword: string) => {
    console.debug('[AUTH] Completing password recovery for user:', userId);
    setIsLoading(true);
    try {
      const res = await awCompletePasswordRecovery(userId, secret, newPassword);
      if (!res.success) {
        console.error('[AUTH] ❌ Password reset failed:', res.error);
        throw new Error(res.error || 'Password reset failed');
      }
      console.debug('[AUTH] ✅ Password reset successful');
    } catch (error) {
      console.error('[AUTH] ❌ Password reset error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    console.debug('[AUTH] Google OAuth login initiated');
    setIsLoading(true);
    try {
      const res = await awLoginWithGoogle();
      if (!res.success) {
        console.error('[AUTH] ❌ Google login failed:', res.error);
        throw new Error(res.error || 'Google login failed');
      }
      // OAuth flow will redirect; no further action here
      console.debug('[AUTH] ✅ Google OAuth initiated');
    } catch (error) {
      console.error('[AUTH] ❌ Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        authReady, // 🔴 CRITICAL: Components must check this before making API calls
        login,
        register,
        logout,
        startPasswordRecovery,
        completePasswordRecovery,
        loginWithGoogle,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
