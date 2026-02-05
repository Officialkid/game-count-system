'use client';

import { FirebaseEvent } from '@/lib/firebase-collections';
import { isDayLocked, getLockedDays, formatLockedDays } from '@/lib/day-locking';

interface LockedDayIndicatorProps {
  event: FirebaseEvent;
  dayNumber?: number;
  showAllLocked?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function LockedDayIndicator({
  event,
  dayNumber,
  showAllLocked = false,
  size = 'medium',
}: LockedDayIndicatorProps) {
  const lockedDays = getLockedDays(event);

  // If showing specific day
  if (dayNumber !== undefined) {
    const isLocked = isDayLocked(event, dayNumber);
    
    if (!isLocked) {
      return null;
    }

    const sizeClasses = {
      small: 'text-xs px-2 py-0.5',
      medium: 'text-sm px-3 py-1',
      large: 'text-base px-4 py-2',
    };

    return (
      <div
        className={`
          inline-flex items-center gap-1 rounded-full
          bg-red-100 text-red-700 font-semibold
          ${sizeClasses[size]}
        `}
      >
        <svg
          className={`${size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Locked
      </div>
    );
  }

  // Show all locked days summary
  if (showAllLocked && lockedDays.length > 0) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-red-500 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-red-800">
              Locked Days
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {formatLockedDays(lockedDays)}
            </p>
            <p className="text-xs text-red-600 mt-2">
              No scores can be submitted for locked days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
