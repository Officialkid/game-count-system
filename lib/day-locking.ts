/**
 * Day Locking Helpers
 * Functions to manage day locking for multi-day events
 */

import { FirebaseEvent } from './firebase-collections';

/**
 * Check if a specific day is locked
 */
export function isDayLocked(event: FirebaseEvent, dayNumber: number): boolean {
  if (!event.lockedDays || event.lockedDays.length === 0) {
    return false;
  }
  return event.lockedDays.includes(dayNumber);
}

/**
 * Get all locked days for an event
 */
export function getLockedDays(event: FirebaseEvent): number[] {
  return event.lockedDays || [];
}

/**
 * Check if any days are locked
 */
export function hasLockedDays(event: FirebaseEvent): boolean {
  return event.lockedDays !== undefined && event.lockedDays.length > 0;
}

/**
 * Get unlocked days for an event
 */
export function getUnlockedDays(event: FirebaseEvent): number[] {
  const totalDays = event.scoringMode === 'daily' 
    ? calculateTotalDays(event.start_at, event.end_at)
    : 1;
  
  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  const lockedDays = getLockedDays(event);
  
  return allDays.filter(day => !lockedDays.includes(day));
}

/**
 * Calculate total days between start and end date
 */
function calculateTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end date
}

/**
 * Validate if a day can be locked
 */
export function canLockDay(
  event: FirebaseEvent,
  dayNumber: number
): { allowed: boolean; reason?: string } {
  // Can't lock if event is finalized
  if (event.is_finalized) {
    return {
      allowed: false,
      reason: 'Cannot lock days on finalized events',
    };
  }

  // Can't lock if event is archived
  if (event.eventStatus === 'archived') {
    return {
      allowed: false,
      reason: 'Cannot lock days on archived events',
    };
  }

  // Check if day number is valid
  const totalDays = event.scoringMode === 'daily'
    ? calculateTotalDays(event.start_at, event.end_at)
    : 1;

  if (dayNumber < 1 || dayNumber > totalDays) {
    return {
      allowed: false,
      reason: `Invalid day number. Event has ${totalDays} day(s)`,
    };
  }

  // Check if day is already locked
  if (isDayLocked(event, dayNumber)) {
    return {
      allowed: false,
      reason: `Day ${dayNumber} is already locked`,
    };
  }

  return { allowed: true };
}

/**
 * Validate if a day can be unlocked
 */
export function canUnlockDay(
  event: FirebaseEvent,
  dayNumber: number
): { allowed: boolean; reason?: string } {
  // Can't unlock if event is finalized
  if (event.is_finalized) {
    return {
      allowed: false,
      reason: 'Cannot unlock days on finalized events',
    };
  }

  // Can't unlock if event is archived
  if (event.eventStatus === 'archived') {
    return {
      allowed: false,
      reason: 'Cannot unlock days on archived events',
    };
  }

  // Check if day is locked
  if (!isDayLocked(event, dayNumber)) {
    return {
      allowed: false,
      reason: `Day ${dayNumber} is not locked`,
    };
  }

  return { allowed: true };
}

/**
 * Get lock status badge info
 */
export function getLockStatusBadge(isLocked: boolean): {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
} {
  if (isLocked) {
    return {
      icon: '🔒',
      label: 'Locked',
      color: '#DC2626',
      bgColor: '#FEE2E2',
    };
  }
  return {
    icon: '🔓',
    label: 'Unlocked',
    color: '#059669',
    bgColor: '#D1FAE5',
  };
}

/**
 * Format locked days for display
 */
export function formatLockedDays(lockedDays: number[]): string {
  if (lockedDays.length === 0) {
    return 'No locked days';
  }

  if (lockedDays.length === 1) {
    return `Day ${lockedDays[0]} is locked`;
  }

  const sorted = [...lockedDays].sort((a, b) => a - b);
  return `Days ${sorted.join(', ')} are locked`;
}

/**
 * Check if score submission is allowed for a day
 */
export function canSubmitScoreForDay(
  event: FirebaseEvent,
  dayNumber: number
): { allowed: boolean; reason?: string } {
  // Check if day is locked
  if (isDayLocked(event, dayNumber)) {
    return {
      allowed: false,
      reason: `Day ${dayNumber} is locked. No new scores can be submitted.`,
    };
  }

  // Check if event is finalized
  if (event.is_finalized) {
    return {
      allowed: false,
      reason: 'Event is finalized. No new scores can be submitted.',
    };
  }

  // Check if event is archived
  if (event.eventStatus === 'archived') {
    return {
      allowed: false,
      reason: 'Event is archived. No new scores can be submitted.',
    };
  }

  return { allowed: true };
}
