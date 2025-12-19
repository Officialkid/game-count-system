'use client';

import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableListItemProps {
  id: string;
  children: React.ReactNode;
  onDelete: (id: string) => Promise<void>;
  onDeleteLabel?: string;
  isDeleting?: boolean;
}

/**
 * A touch-friendly list item that reveals a delete button on swipe left.
 * Also provides a fallback context menu button for non-touch devices.
 */
export function SwipeableListItem({
  id,
  children,
  onDelete,
  onDeleteLabel = 'Delete',
  isDeleting = false,
}: SwipeableListItemProps) {
  const [swiped, setSwiped] = useState(false);
  const [isDeleting_internal, setIsDeleting_internal] = useState(isDeleting);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;

    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;

    // Swipe left reveals delete button (diff > 50)
    if (diff > 50) {
      setSwiped(true);
    } else if (diff < -50) {
      setSwiped(false);
    }
  };

  const handleTouchEnd = () => {
    if (swiped && Math.abs(touchStartX.current - window.scrollX) > 50) {
      // Keep swiped state if moved far enough
    } else {
      setSwiped(false);
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting_internal(true);
    try {
      await onDelete(id);
      setSwiped(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting_internal(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-white border-b border-neutral-200 rounded-lg mb-2"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main content with smooth slide animation */}
      <div
        className={`transform-gpu will-change-transform transition-transform duration-200 ease-out ${swiped ? '-translate-x-20' : 'translate-x-0'}`}
      >
        {children}
      </div>

      {/* Delete button that slides in from right */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-600 flex items-center justify-center">
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting_internal}
          className="w-full h-full flex items-center justify-center text-white hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={onDeleteLabel}
          title={onDeleteLabel}
        >
          {isDeleting_internal ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Fallback delete button for non-touch devices (visible on hover) */}
      <button
        onClick={handleDeleteClick}
        disabled={isDeleting_internal}
        className="hidden md:block absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`${onDeleteLabel} (desktop)`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
