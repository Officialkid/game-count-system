'use client';

import { useState } from 'react';
import { FirebaseEvent } from '@/lib/firebase-collections';
import { isDayLocked, canLockDay, canUnlockDay, getLockStatusBadge } from '@/lib/day-locking';

interface LockDayButtonProps {
  event: FirebaseEvent;
  dayNumber: number;
  adminToken: string;
  onLockChange?: (dayNumber: number, isLocked: boolean) => void;
}

export default function LockDayButton({
  event,
  dayNumber,
  adminToken,
  onLockChange,
}: LockDayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(isDayLocked(event, dayNumber));

  const handleToggleLock = async () => {
    const action = isLocked ? 'unlock' : 'lock';
    const confirmMessage = isLocked
      ? `Are you sure you want to unlock Day ${dayNumber}? Scores can be submitted again.`
      : `Are you sure you want to lock Day ${dayNumber}? No new scores can be submitted for this day.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/events/${event.id}/days/${dayNumber}/lock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, token: adminToken }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const newLockState = action === 'lock';
        setIsLocked(newLockState);
        
        if (onLockChange) {
          onLockChange(dayNumber, newLockState);
        }

        // Show success message
        alert(data.data.message);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Lock/unlock error:', error);
      alert('Failed to update day lock status');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if action is allowed
  const validation = isLocked
    ? canUnlockDay(event, dayNumber)
    : canLockDay(event, dayNumber);

  const badge = getLockStatusBadge(isLocked);

  return (
    <div className="flex items-center gap-2">
      {/* Lock Status Badge */}
      <div
        className="px-2 py-1 rounded text-xs font-semibold"
        style={{
          color: badge.color,
          backgroundColor: badge.bgColor,
        }}
      >
        {badge.icon} {badge.label}
      </div>

      {/* Lock/Unlock Button */}
      <button
        onClick={handleToggleLock}
        disabled={isLoading || !validation.allowed}
        className={`
          px-3 py-1 rounded text-sm font-medium transition-colors
          ${isLoading || !validation.allowed
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isLocked
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-red-500 text-white hover:bg-red-600'
          }
        `}
        title={!validation.allowed ? validation.reason : ''}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : isLocked ? (
          <>🔓 Unlock Day</>
        ) : (
          <>🔒 Lock Day</>
        )}
      </button>

      {/* Reason tooltip if disabled */}
      {!validation.allowed && (
        <div className="text-xs text-gray-500 italic max-w-xs">
          {validation.reason}
        </div>
      )}
    </div>
  );
}
