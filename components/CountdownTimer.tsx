'use client';

import { useState, useEffect } from 'react';
import { getTimeRemaining } from '@/lib/event-lifecycle';

interface CountdownTimerProps {
  autoCleanupDate: string;
  onExpired?: () => void;
}

export default function CountdownTimer({ autoCleanupDate, onExpired }: CountdownTimerProps) {
  const [timeInfo, setTimeInfo] = useState(() => getTimeRemaining(autoCleanupDate));

  useEffect(() => {
    const updateTimer = () => {
      const info = getTimeRemaining(autoCleanupDate);
      setTimeInfo(info);

      if (info.isPastCleanup && onExpired) {
        onExpired();
      }
    };

    // Update every second
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [autoCleanupDate, onExpired]);

  if (!timeInfo.hasCleanupDate) {
    return null;
  }

  if (timeInfo.isPastCleanup) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        Cleanup Pending
      </div>
    );
  }

  // Determine urgency color
  let colorClass = 'bg-green-100 text-green-700';
  if (timeInfo.remainingHours < 1) {
    colorClass = 'bg-red-100 text-red-700';
  } else if (timeInfo.remainingHours < 6) {
    colorClass = 'bg-yellow-100 text-yellow-700';
  }

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${colorClass} text-sm font-medium`}>
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
      {timeInfo.displayText}
    </div>
  );
}
