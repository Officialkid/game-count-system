// components/ui/LoadingSkeleton.tsx
'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'text', count = 1, className = '' }: LoadingSkeletonProps) {
  const variants = {
    text: 'h-4 bg-gray-200 rounded',
    card: 'h-32 bg-gray-200 rounded-lg',
    avatar: 'w-12 h-12 bg-gray-200 rounded-full',
    button: 'h-10 w-24 bg-gray-200 rounded-lg',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse ${variants[variant]} ${className}`}
        />
      ))}
    </>
  );
}

export function LoadingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function LoadingTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4">
          <div className="h-12 bg-gray-200 rounded flex-1" />
          <div className="h-12 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}
