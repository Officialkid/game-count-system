/**
 * Event Mode Helper Functions
 * Utilities for handling different event modes
 */

import { EventMode, EventStatus, EVENT_MODE_CONFIGS, EventModeConfig } from './firebase-collections';

/**
 * Get configuration for a specific event mode
 */
export function getEventModeConfig(mode: EventMode): EventModeConfig {
  return EVENT_MODE_CONFIGS[mode];
}

/**
 * Calculate auto-cleanup date for an event
 */
export function calculateAutoCleanupDate(
  mode: EventMode,
  startDate: Date = new Date()
): string | undefined {
  const config = getEventModeConfig(mode);
  
  if (!config.autoCleanup || !config.maxDuration) {
    return undefined;
  }
  
  const cleanupDate = new Date(startDate);
  cleanupDate.setDate(cleanupDate.getDate() + config.maxDuration);
  
  return cleanupDate.toISOString();
}

/**
 * Calculate end date based on mode and duration
 */
export function calculateEndDate(
  mode: EventMode,
  startDate: Date,
  requestedDays: number
): Date {
  const config = getEventModeConfig(mode);
  const endDate = new Date(startDate);
  
  // Enforce max duration for modes that have it
  let actualDays = requestedDays;
  if (config.maxDuration !== null) {
    actualDays = Math.min(requestedDays, config.maxDuration);
  }
  
  endDate.setDate(endDate.getDate() + actualDays);
  return endDate;
}

/**
 * Validate if a feature is available for a mode
 */
export function isFeatureAvailable(mode: EventMode, feature: keyof EventModeConfig['features']): boolean {
  return getEventModeConfig(mode).features[feature];
}

/**
 * Get human-readable mode description
 */
export function getModeName(mode: EventMode): string {
  const names: Record<EventMode, string> = {
    quick: 'Quick Event',
    camp: 'Camp Event',
    advanced: 'Advanced Event',
  };
  return names[mode];
}

/**
 * Get mode description
 */
export function getModeDescription(mode: EventMode): string {
  const descriptions: Record<EventMode, string> = {
    quick: 'Perfect for one-time events. Auto-deletes after 24 hours. No authentication required.',
    camp: 'Ideal for multi-day camps and tournaments. Supports up to 30 days with optional authentication.',
    advanced: 'Full-featured events for organizations. Permanent storage, authentication required, unlimited duration.',
  };
  return descriptions[mode];
}

/**
 * Validate mode constraints
 */
export function validateModeConstraints(
  mode: EventMode,
  numberOfDays: number,
  requiresAuth: boolean
): { valid: boolean; errors: string[] } {
  const config = getEventModeConfig(mode);
  const errors: string[] = [];
  
  // Check max duration
  if (config.maxDuration !== null && numberOfDays > config.maxDuration) {
    errors.push(`${getModeName(mode)} supports maximum ${config.maxDuration} days`);
  }
  
  // Check multi-day support
  if (numberOfDays > 1 && !config.features.multiDay) {
    errors.push(`${getModeName(mode)} only supports single-day events`);
  }
  
  // Check authentication requirement
  if (config.requiresAuth && !requiresAuth) {
    errors.push(`${getModeName(mode)} requires authentication`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get recommended mode based on requirements
 */
export function getRecommendedMode(
  numberOfDays: number,
  needsAuth: boolean,
  needsOrganization: boolean
): EventMode {
  if (needsOrganization) {
    return 'advanced';
  }
  
  if (numberOfDays > 30 || needsAuth) {
    return 'advanced';
  }
  
  if (numberOfDays > 1) {
    return 'camp';
  }
  
  return 'quick';
}

/**
 * Determine if event should be cleaned up
 */
export function shouldCleanupEvent(
  eventMode: EventMode,
  autoCleanupDate: string | undefined,
  currentDate: Date = new Date()
): boolean {
  const config = getEventModeConfig(eventMode);
  
  if (!config.autoCleanup || !autoCleanupDate) {
    return false;
  }
  
  const cleanupDate = new Date(autoCleanupDate);
  return currentDate >= cleanupDate;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: EventStatus): string {
  const colors: Record<EventStatus, string> = {
    draft: '#6B7280', // Gray
    active: '#10B981', // Green
    completed: '#3B82F6', // Blue
    archived: '#9CA3AF', // Light Gray
  };
  return colors[status];
}

/**
 * Get mode badge color
 */
export function getModeColor(mode: EventMode): string {
  const colors: Record<EventMode, string> = {
    quick: '#F59E0B', // Amber
    camp: '#8B5CF6', // Purple
    advanced: '#EF4444', // Red
  };
  return colors[mode];
}

/**
 * Get available status transitions
 */
export function getAvailableStatusTransitions(currentStatus: EventStatus): EventStatus[] {
  const transitions: Record<EventStatus, EventStatus[]> = {
    draft: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: [], // Cannot transition from archived
  };
  return transitions[currentStatus] || [];
}
