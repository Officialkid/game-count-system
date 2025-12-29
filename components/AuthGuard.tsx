'use client';

import React, { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  returnUrl?: string;
  redirectIfAuthenticated?: boolean;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>;
}

export function ProtectedPage({ children }: Omit<AuthGuardProps, 'redirectIfAuthenticated'>) {
  return <>{children}</>;
}

export function PublicAuthPage({ children }: Omit<AuthGuardProps, 'returnUrl' | 'redirectIfAuthenticated'>) {
  return <>{children}</>;
}