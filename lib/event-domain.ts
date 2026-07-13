/**
 * Shared event-domain types and constants.
 * These types describe the application's data model without coupling it to a
 * specific storage provider.
 */

export const COLLECTIONS = {
  EVENTS: 'events',
  TEAMS: 'teams',
  SCORES: 'scores',
  EVENT_DAYS: 'event_days',
  USERS: 'users',
  WAITLIST: 'waitlist',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export type EventMode = 'quick' | 'camp' | 'advanced';
export type EventStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ScoringMode = 'continuous' | 'daily';

export interface EventModeConfig {
  requiresAuth: boolean;
  autoCleanup: boolean;
  maxDuration: number | null;
  features: {
    multiDay: boolean;
    organizations: boolean;
    advancedAnalytics: boolean;
    customization: boolean;
  };
}

export const EVENT_MODE_CONFIGS: Record<EventMode, EventModeConfig> = {
  quick: {
    requiresAuth: false,
    autoCleanup: true,
    maxDuration: 1,
    features: {
      multiDay: false,
      organizations: false,
      advancedAnalytics: false,
      customization: false,
    },
  },
  camp: {
    requiresAuth: false,
    autoCleanup: false,
    maxDuration: 30,
    features: {
      multiDay: true,
      organizations: false,
      advancedAnalytics: true,
      customization: true,
    },
  },
  advanced: {
    requiresAuth: true,
    autoCleanup: false,
    maxDuration: null,
    features: {
      multiDay: true,
      organizations: true,
      advancedAnalytics: true,
      customization: true,
    },
  },
};

export interface EventRecord {
  id: string;
  name: string;
  eventMode: EventMode;
  eventStatus: EventStatus;
  requiresAuthentication: boolean;
  autoCleanupDate?: string;
  scoringMode: ScoringMode;
  number_of_days: number;
  status: 'active' | 'expired' | 'finalized';
  start_at: string;
  end_at: string;
  admin_token_hash: string;
  scorer_token_hash: string;
  public_token_hash: string;
  admin_token?: string;
  scorer_token?: string;
  public_token?: string;
  is_finalized: boolean;
  finalized_at?: string;
  lockedDays?: number[];
  archived_at?: string;
  organization_id?: string;
  organization_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TeamRecord {
  id: string;
  event_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ScoreRecord {
  id: string;
  event_id: string;
  team_id: string;
  score: number;
  day_number?: number;
  penalty?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EventDayRecord {
  id: string;
  event_id: string;
  day_number: number;
  date: string;
  is_locked: boolean;
  created_at: string;
}

export interface WaitlistRecord {
  id: string;
  email: string;
  created_at: string;
}
