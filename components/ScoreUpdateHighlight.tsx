/**
 * ScoreUpdateHighlight Component
 * 
 * Visual animation for highlighting when scores update in real-time
 * Provides visual feedback that new data has arrived
 * 
 * Features:
 * - Brief flash animation when score changes
 * - Customizable highlight color
 * - Smooth fade-out transition
 * - Auto-dismiss after animation
 */

import React, { useEffect, useState } from 'react';

export interface ScoreUpdateHighlightProps {
  /** Unique key to detect changes */
  scoreKey: string;
  /** Content to render */
  children: React.ReactNode;
  /** Duration of highlight in ms */
  duration?: number;
  /** Highlight color */
  highlightColor?: 'green' | 'blue' | 'yellow' | 'purple';
  /** Custom class name */
  className?: string;
}

/**
 * Wrapper component that highlights when content changes
 */
export function ScoreUpdateHighlight({
  scoreKey,
  children,
  duration = 1000,
  highlightColor = 'green',
  className = '',
}: ScoreUpdateHighlightProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [prevKey, setPrevKey] = useState(scoreKey);

  // Detect when scoreKey changes (new data)
  useEffect(() => {
    if (scoreKey !== prevKey && prevKey !== '') {
      setIsHighlighted(true);
      setPrevKey(scoreKey);

      // Remove highlight after duration
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, duration);

      return () => clearTimeout(timer);
    } else if (prevKey === '') {
      // First render, no animation
      setPrevKey(scoreKey);
    }
  }, [scoreKey, prevKey, duration]);

  // Highlight color classes
  const highlightColors = {
    green: 'bg-green-100 ring-2 ring-green-300',
    blue: 'bg-blue-100 ring-2 ring-blue-300',
    yellow: 'bg-yellow-100 ring-2 ring-yellow-300',
    purple: 'bg-purple-100 ring-2 ring-purple-300',
  };

  return (
    <div
      className={`transition-all duration-300 rounded-lg ${
        isHighlighted ? highlightColors[highlightColor] : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Pulse animation for new items
 */
export function NewItemPulse({ children }: { children: React.ReactNode }) {
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ${
        isNew ? 'animate-pulse-once bg-green-50 scale-105' : 'scale-100'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Slide-in animation for new scores
 */
export function SlideInScore({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-500 ${
        isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-4'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * Rank change indicator with animation
 */
export function RankChangeIndicator({
  direction,
  fromRank,
  toRank,
}: {
  direction: 'up' | 'down';
  fromRank: number;
  toRank: number;
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const change = Math.abs(toRank - fromRank);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all duration-500 ${
        direction === 'up'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      } ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
    >
      <span className="text-lg">{direction === 'up' ? '↑' : '↓'}</span>
      <span>+{change}</span>
    </div>
  );
}

/**
 * Score change animation (for point increases)
 */
export function ScoreChange({
  value,
  duration = 1500,
}: {
  value: number;
  duration?: number;
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!show) return null;

  return (
    <div
      className="absolute -top-8 right-0 text-green-600 font-bold text-xl animate-float-up"
      style={{
        animation: `floatUp ${duration}ms ease-out forwards`,
      }}
    >
      +{value}
    </div>
  );
}

/**
 * Loading skeleton for score items
 */
export function ScoreItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-16 h-8 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * Shimmer effect for loading states
 */
export function ShimmerEffect() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
    </div>
  );
}

// Add custom animations to global CSS or tailwind.config.js:
/*
@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-30px);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse-once {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
*/
