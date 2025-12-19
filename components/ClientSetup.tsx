'use client';

import { useEffect } from 'react';
// Mock fetch removed; app uses Appwrite services directly.

export function ClientSetup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // No client-side mock initialization needed.
  }, []);

  return <>{children}</>; 
}
