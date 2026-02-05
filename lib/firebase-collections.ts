/**
 * Firebase Firestore Collection Names
 * Centralized collection name management for type safety
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

/**
 * Firestore Data Models (TypeScript interfaces)
 * Define your data structure here
 */

// Event Mode Types
export type EventMode = 'quick' | 'camp' | 'advanced';
export type EventStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ScoringMode = 'continuous' | 'daily';

// Mode Configuration
export interface EventModeConfig {
  requiresAuth: boolean;
  autoCleanup: boolean;
  maxDuration: number | null; // in days, null = unlimited
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
    maxDuration: 1, // 24 hours
    features: {
      multiDay: false,
      organizations: false,
      advancedAnalytics: false,
      customization: false,
    },
  },
  camp: {
    requiresAuth: false, // Optional
    autoCleanup: false,
    maxDuration: 30, // 30 days max
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
    maxDuration: null, // Unlimited
    features: {
      multiDay: true,
      organizations: true,
      advancedAnalytics: true,
      customization: true,
    },
  },
};

export interface FirebaseEvent {
  id: string;
  name: string;
  
  // Event Mode System
  eventMode: EventMode;
  eventStatus: EventStatus;
  requiresAuthentication: boolean;
  autoCleanupDate?: string; // ISO date string - when event auto-deletes
  
  // Scoring Configuration
  scoringMode: ScoringMode; // 'continuous' | 'daily'
  number_of_days: number;
  
  // Legacy status field (for backward compatibility)
  status: 'active' | 'expired' | 'finalized';
  
  // Date Management
  start_at: string; // ISO date string
  end_at: string; // ISO date string
  
  // Security Tokens (Hashed - stored in Firestore)
  admin_token_hash: string;
  scorer_token_hash: string;
  public_token_hash: string;
  
  // Plain tokens (DEPRECATED - use hashed versions)
  // These should only be returned once when event is created
  admin_token?: string; // For backward compatibility
  scorer_token?: string; // For backward compatibility
  public_token?: string; // For backward compatibility
  
  // Finalization
  is_finalized: boolean;
  finalized_at?: string;
  
  // Day Locking (for multi-day events)
  lockedDays?: number[];  // Array of locked day numbers [1, 2, 3]
  
  // Archival
  archived_at?: string;
  
  // Organization (Advanced Mode)
  organization_id?: string;
  organization_name?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string; // User ID if authenticated
}

export interface FirebaseTeam {
  id: string;
  event_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface FirebaseScore {
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

export interface FirebaseEventDay {
  id: string;
  event_id: string;
  day_number: number;
  date: string;
  is_locked: boolean;
  created_at: string;
}

export interface FirebaseWaitlist {
  id: string;
  email: string;
  created_at: string;
}
