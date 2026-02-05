/**
 * Frontend Firebase Helpers
 * Utilities for components to handle Firebase data structures
 */

// ==============================================
// DATE TRANSFORMATIONS
// ==============================================

/**
 * Safely convert any date format to Date object
 * Works with: ISO strings, Firebase Timestamps (converted to ISO), Date objects
 */
export function safeDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  
  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format date for display (handles all formats)
 */
export function formatDate(
  value: string | Date | null | undefined,
  format: 'short' | 'long' | 'time' = 'long'
): string {
  const date = safeDate(value);
  if (!date) return 'N/A';
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'long':
    default:
      return date.toLocaleString();
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  const date = safeDate(value);
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(date, 'short');
}

// ==============================================
// MODE-AWARE HELPERS
// ==============================================

export type EventMode = 'quick' | 'multi-day' | 'camp' | 'custom' | 'advanced';

/**
 * Check if event is quick mode (1 day, auto-cleanup)
 */
export function isQuickMode(mode: string | undefined): boolean {
  return mode === 'quick';
}

/**
 * Check if event is multi-day mode (2-3 days, day locking)
 */
export function isMultiDayMode(mode: string | undefined): boolean {
  return mode === 'multi-day' || mode === 'camp';
}

/**
 * Check if event is custom mode (advanced features)
 */
export function isCustomMode(mode: string | undefined): boolean {
  return mode === 'custom' || mode === 'advanced';
}

/**
 * Get features available for event mode
 */
export function getModeFeatures(mode: string | undefined): {
  dayLocking: boolean;
  multiDay: boolean;
  customDuration: boolean;
  advancedScoring: boolean;
  autoCleanup: boolean;
} {
  const modeStr = mode || 'quick';
  
  return {
    dayLocking: isMultiDayMode(modeStr) || isCustomMode(modeStr),
    multiDay: isMultiDayMode(modeStr) || isCustomMode(modeStr),
    customDuration: isCustomMode(modeStr),
    advancedScoring: isCustomMode(modeStr),
    autoCleanup: isQuickMode(modeStr),
  };
}

/**
 * Get user-friendly mode name
 */
export function getModeName(mode: string | undefined): string {
  switch (mode) {
    case 'quick':
      return 'Quick Event';
    case 'multi-day':
    case 'camp':
      return 'Multi-Day Event';
    case 'custom':
    case 'advanced':
      return 'Custom Event';
    default:
      return 'Event';
  }
}

/**
 * Get mode description
 */
export function getModeDescription(mode: string | undefined): string {
  switch (mode) {
    case 'quick':
      return 'Single day, auto-cleanup after 7 days';
    case 'multi-day':
    case 'camp':
      return '2-3 days with day locking';
    case 'custom':
    case 'advanced':
      return 'Full customization with advanced features';
    default:
      return '';
  }
}

/**
 * Get mode emoji icon
 */
export function getModeIcon(mode: string | undefined): string {
  switch (mode) {
    case 'quick':
      return '⚡';
    case 'multi-day':
    case 'camp':
      return '🏕️';
    case 'custom':
    case 'advanced':
      return '⚙️';
    default:
      return '📅';
  }
}

// ==============================================
// ERROR HANDLING
// ==============================================

/**
 * Convert Firebase error to user-friendly message
 */
export function formatFirebaseError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || error.error || String(error);
  
  // Firebase-specific errors
  if (message.includes('permission-denied')) {
    return 'You don\'t have permission to access this data';
  }
  if (message.includes('not-found')) {
    return 'The requested data was not found';
  }
  if (message.includes('already-exists')) {
    return 'This item already exists';
  }
  if (message.includes('unauthenticated')) {
    return 'Authentication required';
  }
  if (message.includes('deadline-exceeded')) {
    return 'Request timed out. Please try again';
  }
  if (message.includes('unavailable')) {
    return 'Service temporarily unavailable';
  }
  if (message.includes('resource-exhausted')) {
    return 'Too many requests. Please wait a moment';
  }
  if (message.includes('invalid-argument')) {
    return 'Invalid data provided';
  }
  
  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error. Check your internet connection';
  }
  
  // Default: return simplified message
  return message.length > 100 ? message.substring(0, 100) + '...' : message;
}

// ==============================================
// DATA VALIDATION
// ==============================================

/**
 * Check if API response is valid
 */
export function isValidResponse<T = any>(
  response: any
): response is { success: true; data: T } {
  return response && response.success === true && response.data != null;
}

/**
 * Extract data from API response safely
 */
export function extractData<T>(
  response: any,
  defaultValue: T
): T {
  if (isValidResponse(response)) {
    return response.data;
  }
  return defaultValue;
}

/**
 * Check if value is a valid UUID (used for IDs)
 */
export function isValidId(id: string | undefined | null): boolean {
  if (!id) return false;
  // UUID v4 regex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Check if value is a valid Firestore document ID
 */
export function isValidFirestoreId(id: string | undefined | null): boolean {
  if (!id) return false;
  // Firestore IDs are typically 20 characters alphanumeric
  return /^[a-zA-Z0-9]{20,}$/.test(id);
}

/**
 * Safely parse JSON with fallback
 */
export function safeParseJSON<T>(
  json: string | null | undefined,
  defaultValue: T
): T {
  if (!json) return defaultValue;
  
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

// ==============================================
// ARRAY/OBJECT HELPERS
// ==============================================

/**
 * Group items by a key
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string | number
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const key = String(keyFn(item));
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sort items by a key
 */
export function sortBy<T>(
  items: T[],
  keyFn: (item: T) => number | string,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Calculate sum of values
 */
export function sum(values: number[]): number {
  return values.reduce((total, val) => total + val, 0);
}

/**
 * Calculate average of values
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}
