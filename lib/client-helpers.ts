/**
 * Client-side formatting and event-mode helpers shared across the UI.
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

export type DisplayEventMode = 'quick' | 'multi-day' | 'camp' | 'custom' | 'advanced';

export function isQuickMode(mode: string | undefined): boolean {
  return mode === 'quick';
}

export function isMultiDayMode(mode: string | undefined): boolean {
  return mode === 'multi-day' || mode === 'camp';
}

export function isCustomMode(mode: string | undefined): boolean {
  return mode === 'custom' || mode === 'advanced';
}

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

export function getModeIcon(mode: string | undefined): string {
  switch (mode) {
    case 'quick':
      return 'Lightning';
    case 'multi-day':
    case 'camp':
      return 'Calendar';
    case 'custom':
    case 'advanced':
      return 'Settings';
    default:
      return 'Event';
  }
}

export function formatApiError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (message.includes('permission-denied')) {
    return "You don't have permission to access this data";
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
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error. Check your internet connection';
  }

  return message.length > 100 ? `${message.substring(0, 100)}...` : message;
}

export function isValidResponse<T = unknown>(
  response: unknown
): response is { success: true; data: T } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as { success?: unknown }).success === true &&
    'data' in response &&
    (response as { data?: unknown }).data != null
  );
}

export function extractData<T>(response: unknown, defaultValue: T): T {
  if (isValidResponse<T>(response)) {
    return response.data;
  }
  return defaultValue;
}

export function isValidId(id: string | undefined | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function isValidLegacyId(id: string | undefined | null): boolean {
  if (!id) return false;
  return /^[a-zA-Z0-9]{20,}$/.test(id);
}

export function safeParseJSON<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue;

  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

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

export function sum(values: number[]): number {
  return values.reduce((total, val) => total + val, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}
