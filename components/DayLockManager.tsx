'use client';

import { useState, useEffect } from 'react';
import { FirebaseEvent } from '@/lib/firebase-collections';
import { getLockedDays, getUnlockedDays } from '@/lib/day-locking';
import LockDayButton from './LockDayButton';
import LockedDayIndicator from './LockedDayIndicator';

interface DayLockManagerProps {
  event: FirebaseEvent;
  adminToken: string;
  onUpdate?: () => void;
}

export default function DayLockManager({
  event,
  adminToken,
  onUpdate,
}: DayLockManagerProps) {
  const [lockedDays, setLockedDays] = useState<number[]>(getLockedDays(event));
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Calculate total days
  const totalDays = event.scoringMode === 'daily'
    ? calculateTotalDays(event.start_at, event.end_at)
    : 1;

  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  const unlockedDays = getUnlockedDays(event);

  useEffect(() => {
    setLockedDays(getLockedDays(event));
  }, [event]);

  const handleLockChange = (dayNumber: number, isLocked: boolean) => {
    if (isLocked) {
      setLockedDays([...lockedDays, dayNumber].sort((a, b) => a - b));
    } else {
      setLockedDays(lockedDays.filter(d => d !== dayNumber));
    }

    if (onUpdate) {
      onUpdate();
    }
  };

  // Don't show for single-day events
  if (event.scoringMode !== 'daily') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Day Lock Manager</h3>
          <div className="text-sm text-gray-600">
            {lockedDays.length} of {totalDays} days locked
          </div>
        </div>
      </div>

      {/* Locked Days Summary */}
      {lockedDays.length > 0 && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <LockedDayIndicator event={event} showAllLocked />
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Day Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Day to Lock/Unlock
          </label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {allDays.map((day) => (
              <option key={day} value={day}>
                Day {day} {lockedDays.includes(day) ? '🔒 (Locked)' : '🔓 (Unlocked)'}
              </option>
            ))}
          </select>
        </div>

        {/* Lock/Unlock Button */}
        <div>
          <LockDayButton
            event={event}
            dayNumber={selectedDay}
            adminToken={adminToken}
            onLockChange={handleLockChange}
          />
        </div>

        {/* Day List */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">All Days Status</h4>
          <div className="space-y-2">
            {allDays.map((day) => {
              const isLocked = lockedDays.includes(day);
              return (
                <div
                  key={day}
                  className={`
                    flex items-center justify-between p-3 rounded-md border
                    ${isLocked 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Day {day}</span>
                    <LockedDayIndicator event={event} dayNumber={day} size="small" />
                  </div>
                  {day === selectedDay && (
                    <span className="text-xs text-blue-600 font-medium">
                      ← Selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-blue-800">
                About Day Locking
              </h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Locked days prevent new score submissions</li>
                <li>• Existing scores remain unchanged</li>
                <li>• Only admins can lock/unlock days</li>
                <li>• Cannot lock/unlock finalized or archived events</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}
