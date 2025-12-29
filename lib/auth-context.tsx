'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from './appwrite';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  startPasswordRecovery: (email: string) => Promise<void>;
  completePasswordRecovery: (userId: string, secret: string, newPassword: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const checkAuth = async () => {
    try {
      console.log('[AUTH] Checking for existing session...');
      
      // Try to get current session
      const session = await account.getSession('current');
      const currentUser = await account.get();
      
      setUser({
        id: currentUser.$id,
        name: currentUser.name || currentUser.email || 'User',
        email: currentUser.email
      });
      setIsAuthenticated(true);
      
      console.log('[AUTH] ✅ Session restored:', {
        userId: currentUser.$id,
        email: currentUser.email,
        sessionId: session.$id
      });
    } catch (error: any) {
      console.log('[AUTH] No existing session, creating anonymous session...');
      
      try {
        // Create anonymous session for guest users
        const anonSession = await account.createAnonymousSession();
        const anonUser = await account.get();
        
        setUser({
          id: anonUser.$id,
          name: 'Guest',
          email: ''
        });
        setIsAuthenticated(true);
        
        console.log('[AUTH] ✅ Anonymous session created:', {
          userId: anonUser.$id,
          sessionId: anonSession.$id
        });
      } catch (anonError: any) {
        console.error('[AUTH] ❌ Failed to create anonymous session:', anonError);
        setIsAuthenticated(false);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
      setAuthReady(true);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Periodic session check (every 60 seconds)
    const interval = setInterval(checkAuth, 60000);
    
    // Check on window focus
    const handleFocus = () => checkAuth();
    window.addEventListener('focus', handleFocus);
    
    // Check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Delete anonymous session first if it exists
      try {
        await account.deleteSession('current');
        console.log('[AUTH] Deleted anonymous session before login');
      } catch (e) {
        console.log('[AUTH] No session to delete (expected)');
      }
      
      await account.createEmailPasswordSession(email, password);
      await checkAuth();
    } catch (error: any) {
      console.error('[AUTH] Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Delete anonymous session first (Appwrite prevents creating accounts with active sessions)
      try {
        await account.deleteSession('current');
        console.log('[AUTH] Deleted anonymous session before registration');
      } catch (e) {
        console.log('[AUTH] No session to delete (expected)');
      }
      
      // Create new account and login
      await account.create('unique()', email, password, name);
      await account.createEmailPasswordSession(email, password);
      await checkAuth();
    } catch (error: any) {
      console.error('[AUTH] Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setIsAuthenticated(false);
      setUser(null);
      console.log('[AUTH] Logged out, creating new anonymous session...');
      await checkAuth(); // Create new anonymous session
    } catch (error: any) {
      console.error('[AUTH] Logout failed:', error);
    }
  };

  const startPasswordRecovery = async (email: string) => {
    // Implementation would go here
  };

  const completePasswordRecovery = async (userId: string, secret: string, newPassword: string) => {
    // Implementation would go here
  };

  const loginWithGoogle = async () => {
    // Implementation would go here
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        authReady,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}