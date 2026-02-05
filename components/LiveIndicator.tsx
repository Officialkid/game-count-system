/**
 * LiveIndicator Component
 * 
 * Visual indicator showing real-time connection status
 * - Green pulsing dot: Connected and receiving updates
 * - Yellow dot: Connecting/Reconnecting
 * - Red dot: Disconnected/Error
 * 
 * Features:
 * - Animated pulsing effect when live
 * - Last update timestamp
 * - Reconnect button on error
 * - Tooltip with connection details
 */

import React from 'react';

export interface LiveIndicatorProps {
  connected: boolean;
  loading?: boolean;
  error?: string | null;
  lastUpdate?: Date | null;
  onReconnect?: () => void;
  compact?: boolean;
}

export function LiveIndicator({
  connected,
  loading = false,
  error = null,
  lastUpdate = null,
  onReconnect,
  compact = false,
}: LiveIndicatorProps) {
  // Determine status and styling
  const getStatus = () => {
    if (error) return { label: 'Error', color: 'red', pulse: false };
    if (loading) return { label: 'Connecting', color: 'yellow', pulse: true };
    if (connected) return { label: 'Live', color: 'green', pulse: true };
    return { label: 'Offline', color: 'gray', pulse: false };
  };

  const status = getStatus();

  // Format relative time
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return '';
    
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return 'a while ago';
  };

  // Color classes
  const colorClasses = {
    green: {
      dot: 'bg-green-500',
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      ring: 'ring-green-400',
    },
    yellow: {
      dot: 'bg-yellow-500',
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      ring: 'ring-yellow-400',
    },
    red: {
      dot: 'bg-red-500',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      ring: 'ring-red-400',
    },
    gray: {
      dot: 'bg-gray-400',
      text: 'text-gray-700',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      ring: 'ring-gray-400',
    },
  };

  const colors = colorClasses[status.color as keyof typeof colorClasses];

  // Compact version (just the dot and label)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
          {status.pulse && (
            <span
              className={`absolute w-2 h-2 rounded-full ${colors.dot} opacity-75 animate-ping`}
              style={{ animationDuration: '2s' }}
            />
          )}
        </div>
        <span className={`text-sm font-medium ${colors.text}`}>
          {status.label}
        </span>
      </div>
    );
  }

  // Full version with details
  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border ${colors.bg} ${colors.border} transition-all duration-300`}
      role="status"
      aria-live="polite"
    >
      {/* Pulsing dot */}
      <div className="relative flex items-center justify-center">
        <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
        {status.pulse && (
          <>
            <span
              className={`absolute w-3 h-3 rounded-full ${colors.dot} opacity-75 animate-ping`}
              style={{ animationDuration: '2s' }}
            />
            <span
              className={`absolute w-3 h-3 rounded-full ${colors.ring} opacity-25 animate-ping`}
              style={{ animationDuration: '2s', animationDelay: '0.5s' }}
            />
          </>
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${colors.text}`}>
          {status.label}
        </span>
        
        {/* Last update time */}
        {connected && lastUpdate && (
          <span className="text-xs text-gray-700">
            Updated {formatLastUpdate(lastUpdate)}
          </span>
        )}
        
        {/* Error message */}
        {error && (
          <span className="text-xs text-red-600">
            {error}
          </span>
        )}
      </div>

      {/* Reconnect button */}
      {error && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-2 px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          aria-label="Reconnect"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}

/**
 * Simple connection dot (minimal version)
 */
export function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <div
        className={`w-3 h-3 rounded-full ${
          connected ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {connected && (
        <span
          className="absolute w-3 h-3 rounded-full bg-green-500 opacity-75 animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}
    </div>
  );
}

/**
 * Live badge (for headers/navigation)
 */
export function LiveBadge({ connected }: { connected: boolean }) {
  if (!connected) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 border border-green-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="text-xs font-semibold text-green-700">LIVE</span>
    </span>
  );
}
