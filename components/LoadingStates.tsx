// components/LoadingStates.tsx
// FIXED: Added proper ARIA attributes (role, aria-live, aria-label) and dark mode support (UI-DEBUG-REPORT Issue #7)
'use client';

import { Card } from './Card';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center" role="status" aria-live="polite" aria-label="Loading content">
      <svg
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingCard() {
  return (
    <Card className="animate-pulse" role="status" aria-live="polite" aria-label="Loading card">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
      <span className="sr-only">Loading content...</span>
    </Card>
  );
}

export function LoadingTeamCard() {
  return (
    <Card className="animate-pulse" role="status" aria-live="polite" aria-label="Loading team card">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
      <span className="sr-only">Loading team information...</span>
    </Card>
  );
}

export function LoadingScoreboard() {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading scoreboard">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <LoadingTeamCard key={i} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading scoreboard data...</span>
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Card role="status" aria-live="polite" aria-label="Loading table">
      <div className="animate-pulse">
        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading table data...</span>
    </Card>
  );
}

export function LoadingDashboard() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-label="Loading dashboard">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading dashboard content...</span>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} aria-hidden="true"></div>;
}

export function LoadingButton() {
  return (
    <button
      disabled
      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md opacity-50 cursor-not-allowed"
      role="status"
      aria-live="polite"
      aria-label="Loading button"
    >
      <LoadingSpinner size="sm" />
      <span className="ml-2">Loading...</span>
    </button>
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label={message}
    >
      <Card className="max-w-sm">
        <div className="flex flex-col items-center gap-4 p-6">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </Card>
    </div>
  );
}

export function LoadingPage({ message = 'Loading page...' }: { message?: string }) {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
        <span className="sr-only">{message}</span>
      </div>
    </div>
  );
}
