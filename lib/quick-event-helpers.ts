/**
 * Quick Event Helpers
 * Utilities for instant Quick Event creation
 */

import { FirebaseEvent } from './firebase-collections';

/**
 * Parse comma-separated team names into array
 * Handles various input formats and cleans team names
 * 
 * @example
 * parseTeamNames("Team A, Team B, Team C") 
 * // Returns: ["Team A", "Team B", "Team C"]
 * 
 * parseTeamNames("Red Team,Blue Team , Green Team")
 * // Returns: ["Red Team", "Blue Team", "Green Team"]
 */
export function parseTeamNames(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }

  return input
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .filter(name => name.length <= 50); // Max 50 chars per team name
}

/**
 * Validate Quick Event input
 * Returns validation result with error messages if invalid
 */
export interface QuickEventValidation {
  valid: boolean;
  errors: string[];
}

export function validateQuickEventInput(
  eventName: string,
  numberOfDays: number,
  teamNames?: string[]
): QuickEventValidation {
  const errors: string[] = [];

  // Event name validation
  if (!eventName || !eventName.trim()) {
    errors.push('Event name is required');
  } else if (eventName.length < 3) {
    errors.push('Event name must be at least 3 characters');
  } else if (eventName.length > 100) {
    errors.push('Event name must be less than 100 characters');
  }

  // Number of days validation (Quick events: 1-3 days)
  if (numberOfDays < 1) {
    errors.push('Number of days must be at least 1');
  } else if (numberOfDays > 3) {
    errors.push('Quick events can only have up to 3 days');
  }

  // Team names validation
  if (teamNames && teamNames.length > 0) {
    if (teamNames.length < 2) {
      errors.push('Please add at least 2 teams or leave empty');
    } else if (teamNames.length > 50) {
      errors.push('Maximum 50 teams allowed');
    }

    // Check for duplicate team names
    const uniqueNames = new Set(teamNames.map(name => name.toLowerCase()));
    if (uniqueNames.size !== teamNames.length) {
      errors.push('Duplicate team names detected');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate default team names if none provided
 * Creates generic team names like "Team 1", "Team 2", etc.
 */
export function generateDefaultTeamNames(count: number = 4): string[] {
  const teams: string[] = [];
  for (let i = 1; i <= count; i++) {
    teams.push(`Team ${i}`);
  }
  return teams;
}

/**
 * Calculate event dates for Quick events
 * Quick events start today and run for specified number of days
 */
export function calculateQuickEventDates(numberOfDays: number): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + numberOfDays - 1);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}

/**
 * Format Quick Event data for display
 * Returns user-friendly summary of the event
 */
export interface QuickEventSummary {
  name: string;
  days: number;
  teams: number;
  duration: string;
  cleanup: string;
}

export function formatQuickEventSummary(
  event: FirebaseEvent,
  teamCount: number
): QuickEventSummary {
  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);
  
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Calculate cleanup date (24 hours after end)
  const cleanupDate = new Date(endDate);
  cleanupDate.setHours(cleanupDate.getHours() + 24);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    name: event.name,
    days: daysDiff,
    teams: teamCount,
    duration: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    cleanup: formatDate(cleanupDate)
  };
}

/**
 * Generate shareable URLs for Quick Event
 * Returns admin, scorer, and viewer URLs with tokens
 */
export interface ShareableLinks {
  admin: string;
  scorer: string;
  viewer: string;
  scoreboard: string;
}

export function generateShareableLinks(
  eventId: string,
  tokens: {
    admin_token: string;
    scorer_token: string;
    viewer_token: string;
  },
  baseUrl?: string
): ShareableLinks {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  return {
    admin: `${base}/score?eventId=${eventId}&token=${tokens.admin_token}`,
    scorer: `${base}/score?eventId=${eventId}&token=${tokens.scorer_token}`,
    viewer: `${base}/scoreboard?eventId=${eventId}`,
    scoreboard: `${base}/scoreboard?eventId=${eventId}`
  };
}

/**
 * Generate QR code data URLs for share links
 * Returns base64 data URLs for QR codes
 */
export function getQRCodeURL(url: string): string {
  // Using qrcode.react or similar library on client side
  // This is a placeholder - actual QR generation happens in component
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}

/**
 * Get suggested team count based on event context
 */
export function getSuggestedTeamCount(eventName: string): number {
  const nameLower = eventName.toLowerCase();
  
  // Guess team count from event name
  if (nameLower.includes('tournament') || nameLower.includes('championship')) {
    return 8;
  } else if (nameLower.includes('league')) {
    return 6;
  } else if (nameLower.includes('playoff')) {
    return 4;
  }
  
  // Default: 4 teams
  return 4;
}

/**
 * Quick Event creation payload
 * Everything needed to create a Quick Event in one request
 */
export interface QuickEventPayload {
  name: string;
  numberOfDays: number;
  teamNames: string[];
}

/**
 * Quick Event creation response
 * Everything returned after successful creation
 */
export interface QuickEventResponse {
  success: boolean;
  event: FirebaseEvent;
  tokens: {
    admin_token: string;
    scorer_token: string;
    viewer_token: string;
  };
  teams: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  links: ShareableLinks;
  summary: QuickEventSummary;
}

/**
 * Get random color for team
 * Returns hex color code from predefined palette
 */
export function getRandomTeamColor(): string {
  const colors = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Estimate Quick Event completion time
 * Returns estimated time in seconds to complete setup
 */
export function estimateSetupTime(teamCount: number): number {
  // Base time: 5 seconds
  // + 1 second per team creation
  // + 2 seconds for token generation
  return 5 + teamCount + 2;
}

/**
 * Get Quick Event tips
 * Returns helpful tips for first-time users
 */
export function getQuickEventTips(): string[] {
  return [
    'Share the Scorer Link with people who will enter scores',
    'Share the Viewer Link with spectators',
    'Keep the Admin Link private - it has full control',
    'Events auto-delete 24 hours after they end',
    'You can add more teams later from the admin dashboard',
    'Lock completed days to prevent accidental changes'
  ];
}

/**
 * Validate team name individual format
 */
export function isValidTeamName(name: string): boolean {
  if (!name || !name.trim()) return false;
  if (name.length < 2) return false;
  if (name.length > 50) return false;
  
  // No special characters except spaces, hyphens, apostrophes
  const validPattern = /^[a-zA-Z0-9\s\-']+$/;
  return validPattern.test(name);
}

/**
 * Clean and validate team names array
 * Returns cleaned array with invalid names removed
 */
export function cleanTeamNames(names: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  names.forEach(name => {
    const cleaned = name.trim();
    if (isValidTeamName(cleaned)) {
      valid.push(cleaned);
    } else {
      invalid.push(name);
    }
  });

  return { valid, invalid };
}
