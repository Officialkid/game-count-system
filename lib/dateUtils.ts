/**
 * Event Status Utility Functions
 * Determines event status based on current date and event date range
 */

export type EventStatus = 'scheduled' | 'active' | 'completed' | 'inactive';

/**
 * Determines the status of an event based on its start date, end date, and active flag
 * @param startDate - Event start date
 * @param endDate - Event end date
 * @param isActive - Whether the event is manually enabled (false = inactive)
 * @returns Event status: 'scheduled', 'active', 'completed', or 'inactive'
 */
export function getEventStatus(
  startDate: string | Date | null,
  endDate: string | Date | null,
  isActive: boolean = true
): EventStatus {
  // If event is manually disabled, return inactive
  if (!isActive) {
    return 'inactive';
  }

  // If no dates are set, return inactive
  if (!startDate || !endDate) {
    return 'inactive';
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalize times to compare dates properly
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Event hasn't started yet
  if (now < start) {
    return 'scheduled';
  }

  // Event is currently happening
  if (now >= start && now <= end) {
    return 'active';
  }

  // Event has ended
  if (now > end) {
    return 'completed';
  }

  return 'inactive';
}

/**
 * Gets badge styling information for each status
 */
export const STATUS_BADGE_CONFIG = {
  scheduled: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    badgeBgColor: 'bg-blue-700',
    dotColor: 'text-blue-700',
    label: 'Scheduled',
  },
  active: {
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-900',
    badgeBgColor: 'bg-emerald-700',
    dotColor: 'text-emerald-700',
    label: 'Active',
  },
  completed: {
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    badgeBgColor: 'bg-purple-700',
    dotColor: 'text-purple-700',
    label: 'Completed',
  },
  inactive: {
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
    textColor: 'text-neutral-800',
    badgeBgColor: 'bg-neutral-600',
    dotColor: 'text-neutral-600',
    label: 'Inactive',
  },
  archived: {
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    badgeBgColor: 'bg-amber-600',
    dotColor: 'text-amber-600',
    label: 'Archived',
  },
};

/**
 * Format date for display (e.g., "Jan 15, 2025")
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date range (e.g., "Jan 15 - Jan 20, 2025")
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Calculate days until event starts (negative if already started)
 */
export function daysUntilStart(startDate: string | Date): number {
  const now = new Date();
  const start = new Date(startDate);

  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate days until event ends (negative if already ended)
 */
export function daysUntilEnd(endDate: string | Date): number {
  const now = new Date();
  const end = new Date(endDate);

  now.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if event status has transitioned
 * Used for notifications when status changes
 */
export function hasStatusChanged(
  oldStatus: EventStatus,
  startDate: string | Date,
  endDate: string | Date,
  isActive: boolean
): boolean {
  const newStatus = getEventStatus(startDate, endDate, isActive);
  return oldStatus !== newStatus;
}
