'use client';

import { useState, useEffect } from 'react';
import { EventMode, EventStatus } from '@/lib/firebase-collections';
import { getLifecycleInfo, getStatusBadge } from '@/lib/event-lifecycle';

interface EventLifecycleCardProps {
  eventId: string;
  eventStatus: EventStatus;
  eventMode: EventMode;
  isFinalized: boolean;
  autoCleanupDate?: string;
  token: string; // Admin token for actions
  onStatusChange?: (newStatus: EventStatus) => void;
}

export default function EventLifecycleCard({
  eventId,
  eventStatus,
  eventMode,
  isFinalized,
  autoCleanupDate,
  token,
  onStatusChange,
}: EventLifecycleCardProps) {
  const [currentStatus, setCurrentStatus] = useState(eventStatus);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const lifecycle = getLifecycleInfo(
    currentStatus,
    eventMode,
    isFinalized,
    autoCleanupDate
  );
  const badge = getStatusBadge(currentStatus);

  // Update countdown every minute
  useEffect(() => {
    const updateCountdown = () => {
      const info = getLifecycleInfo(currentStatus, eventMode, isFinalized, autoCleanupDate);
      setTimeRemaining(info.timeRemaining.displayText);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentStatus, eventMode, isFinalized, autoCleanupDate]);

  const handleStatusTransition = async (newStatus: EventStatus) => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    try {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_token: token }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update event status');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this event? This action cannot be undone.')) {
      return;
    }

    setIsTransitioning(true);

    try {
      const response = await fetch(`/api/events/${eventId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStatus('archived');
        if (onStatusChange) {
          onStatusChange('archived');
        }
      } else {
        alert(`Failed to archive: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to archive event');
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Event Lifecycle</h3>
          <div
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ 
              color: badge.color, 
              backgroundColor: badge.bgColor 
            }}
          >
            {badge.icon} {badge.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Auto-cleanup Warning */}
        {lifecycle.willAutoCleanup && !lifecycle.timeRemaining.isPastCleanup && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-500 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-yellow-800">
                  Quick Event - Auto-Cleanup Scheduled
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This event will be automatically deleted in <strong>{timeRemaining}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cleanup Pending */}
        {lifecycle.timeRemaining.isPastCleanup && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-red-800">
                  Cleanup Pending
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  This event is scheduled for deletion and will be removed during the next cleanup cycle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Archived Notice */}
        {currentStatus === 'archived' && (
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-gray-700 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path
                  fillRule="evenodd"
                  d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  Event Archived
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  This event is archived and can no longer be modified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Can Edit:</span>
            <span className={`ml-2 font-semibold ${lifecycle.canEdit ? 'text-green-600' : 'text-gray-600'}`}>
              {lifecycle.canEdit ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Can Finalize:</span>
            <span className={`ml-2 font-semibold ${lifecycle.canFinalize ? 'text-green-600' : 'text-gray-600'}`}>
              {lifecycle.canFinalize ? '✓ Yes' : '✗ No'}
            </span>
          </div>
        </div>

        {/* Available Actions */}
        {lifecycle.nextActions.length > 0 && currentStatus !== 'archived' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Actions:</h4>
            <div className="flex flex-wrap gap-2">
              {lifecycle.nextActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => {
                    if (action.action === 'archived') {
                      handleArchive();
                    } else {
                      handleStatusTransition(action.action);
                    }
                  }}
                  disabled={isTransitioning}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${isTransitioning
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                  `}
                >
                  {isTransitioning ? 'Processing...' : action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
