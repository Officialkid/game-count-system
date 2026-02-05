/**
 * Event Lifecycle Management
 * Handles event status transitions, archival, and cleanup
 */

import { EventMode, EventStatus } from './firebase-collections';
import { shouldCleanupEvent } from './event-mode-helpers';

export interface LifecycleTransition {
  from: EventStatus;
  to: EventStatus;
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a status transition is allowed
 */
export function canTransitionTo(
  currentStatus: EventStatus,
  newStatus: EventStatus,
  eventMode: EventMode,
  isFinalized: boolean
): LifecycleTransition {
  // Can't transition from archived
  if (currentStatus === 'archived') {
    return {
      from: currentStatus,
      to: newStatus,
      allowed: false,
      reason: 'Cannot modify archived events',
    };
  }

  // Can't transition to same status
  if (currentStatus === newStatus) {
    return {
      from: currentStatus,
      to: newStatus,
      allowed: false,
      reason: 'Already in this status',
    };
  }

  // Define allowed transitions
  const transitions: Record<EventStatus, EventStatus[]> = {
    draft: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [], // No transitions allowed from archived
  };

  const allowedNext = transitions[currentStatus] || [];
  const isAllowed = allowedNext.includes(newStatus);

  if (!isAllowed) {
    return {
      from: currentStatus,
      to: newStatus,
      allowed: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  // Additional validations
  if (newStatus === 'completed' && !isFinalized) {
    return {
      from: currentStatus,
      to: newStatus,
      allowed: false,
      reason: 'Event must be finalized before marking as completed',
    };
  }

  return {
    from: currentStatus,
    to: newStatus,
    allowed: true,
  };
}

/**
 * Calculate time remaining until auto-cleanup
 */
export function getTimeRemaining(autoCleanupDate: string | undefined): {
  hasCleanupDate: boolean;
  isPastCleanup: boolean;
  remainingMs: number;
  remainingHours: number;
  remainingMinutes: number;
  displayText: string;
} {
  if (!autoCleanupDate) {
    return {
      hasCleanupDate: false,
      isPastCleanup: false,
      remainingMs: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      displayText: 'No cleanup scheduled',
    };
  }

  const cleanupTime = new Date(autoCleanupDate).getTime();
  const nowTime = Date.now();
  const remainingMs = cleanupTime - nowTime;

  if (remainingMs <= 0) {
    return {
      hasCleanupDate: true,
      isPastCleanup: true,
      remainingMs: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      displayText: 'Cleanup pending',
    };
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  let displayText = '';
  if (remainingHours > 0) {
    displayText = `${remainingHours}h ${remainingMinutes}m remaining`;
  } else {
    displayText = `${remainingMinutes}m remaining`;
  }

  return {
    hasCleanupDate: true,
    isPastCleanup: false,
    remainingMs,
    remainingHours,
    remainingMinutes,
    displayText,
  };
}

/**
 * Get lifecycle status info
 */
export function getLifecycleInfo(
  eventStatus: EventStatus,
  eventMode: EventMode,
  isFinalized: boolean,
  autoCleanupDate?: string
): {
  status: EventStatus;
  mode: EventMode;
  canEdit: boolean;
  canFinalize: boolean;
  canArchive: boolean;
  willAutoCleanup: boolean;
  timeRemaining: ReturnType<typeof getTimeRemaining>;
  nextActions: Array<{ action: EventStatus; label: string }>;
} {
  const timeRemaining = getTimeRemaining(autoCleanupDate);
  const willAutoCleanup = autoCleanupDate !== undefined;

  // Determine what actions are available
  const canEdit = eventStatus !== 'archived' && eventStatus !== 'completed';
  const canFinalize = eventStatus === 'active' && !isFinalized;
  const canArchive = eventStatus !== 'archived';

  // Determine next possible actions
  const nextActions: Array<{ action: EventStatus; label: string }> = [];
  
  if (eventStatus === 'draft') {
    nextActions.push({ action: 'active', label: 'Activate Event' });
    nextActions.push({ action: 'archived', label: 'Archive' });
  } else if (eventStatus === 'active') {
    nextActions.push({ action: 'completed', label: 'Complete Event' });
    nextActions.push({ action: 'archived', label: 'Archive' });
  } else if (eventStatus === 'completed') {
    nextActions.push({ action: 'archived', label: 'Archive' });
  }

  return {
    status: eventStatus,
    mode: eventMode,
    canEdit,
    canFinalize,
    canArchive,
    willAutoCleanup,
    timeRemaining,
    nextActions,
  };
}

/**
 * Get status badge color and label
 */
export function getStatusBadge(status: EventStatus): {
  color: string;
  bgColor: string;
  label: string;
  icon: string;
} {
  const badges: Record<EventStatus, { color: string; bgColor: string; label: string; icon: string }> = {
    draft: {
      color: '#6B7280',
      bgColor: '#F3F4F6',
      label: 'Draft',
      icon: '📝',
    },
    active: {
      color: '#10B981',
      bgColor: '#D1FAE5',
      label: 'Active',
      icon: '✅',
    },
    completed: {
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      label: 'Completed',
      icon: '🏆',
    },
    archived: {
      color: '#9CA3AF',
      bgColor: '#F9FAFB',
      label: 'Archived',
      icon: '📦',
    },
  };

  return badges[status];
}

/**
 * Check if event should be deleted (for cleanup job)
 */
export function shouldDeleteEvent(
  eventMode: EventMode,
  eventStatus: EventStatus,
  autoCleanupDate: string | undefined,
  currentDate: Date = new Date()
): boolean {
  // Only Quick mode events can be auto-deleted
  if (eventMode !== 'quick') {
    return false;
  }

  // Only delete if past cleanup date
  if (!autoCleanupDate) {
    return false;
  }

  const cleanupTime = new Date(autoCleanupDate);
  return currentDate >= cleanupTime;
}

/**
 * Calculate next cleanup run time (for cron scheduling)
 */
export function getNextCleanupTime(): Date {
  const now = new Date();
  const next = new Date(now);
  
  // Run every hour at :00
  next.setHours(next.getHours() + 1);
  next.setMinutes(0);
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  return next;
}
