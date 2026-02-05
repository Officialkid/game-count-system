/**
 * Firebase Realtime Hooks Type Definitions
 * 
 * Centralized type definitions for all Firebase real-time hooks
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventMode = 'game' | 'camp';
export type EventStatus = 'active' | 'completed' | 'archived' | 'expired';

export interface Event {
  id: string;
  name: string;
  mode: EventMode;
  status: EventStatus;
  token: string;
  adminToken: string;
  scorerToken?: string;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
  isFinalized?: boolean;
  finalizedAt?: string;
  lockedDays?: number[];
  dayLabels?: Record<number, string>;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export interface Team {
  id: string;
  event_id: string;
  name: string;
  color: string;
  created_at: string;
  total_points?: number;
}

export interface TeamWithScore extends Team {
  total_points: number;
  rank: number;
  previousRank?: number;
}

export interface RankChange {
  teamId: string;
  teamName: string;
  oldRank: number;
  newRank: number;
  direction: 'up' | 'down';
}

// ============================================================================
// SCORE TYPES
// ============================================================================

export interface Score {
  id: string;
  event_id: string;
  team_id: string;
  team_name?: string;
  points: number;
  penalty: number;
  final_score: number;
  day_number?: number;
  game_number?: number;
  game_name?: string;
  notes?: string;
  scorer_name?: string;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseRealtimeEventResult {
  event: Event | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

export interface UseRealtimeTeamsResult {
  teams: TeamWithScore[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  rankChanges: RankChange[];
}

export interface UseRealtimeScoresResult {
  scores: Score[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

// ============================================================================
// FIRESTORE DOCUMENT TYPES (Raw from Firebase)
// ============================================================================

/**
 * Raw event document from Firestore (before transformation)
 */
export interface EventDocument {
  name: string;
  mode: EventMode;
  status: EventStatus;
  token: string;
  adminToken: string;
  scorerToken?: string;
  startDate?: FirebaseTimestamp;
  endDate?: FirebaseTimestamp;
  expiresAt?: FirebaseTimestamp;
  isFinalized?: boolean;
  finalizedAt?: FirebaseTimestamp;
  lockedDays?: number[];
  dayLabels?: Record<number, string>;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}

/**
 * Raw team document from Firestore (before transformation)
 */
export interface TeamDocument {
  name: string;
  color: string;
  totalPoints: number;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}

/**
 * Raw score document from Firestore (before transformation)
 */
export interface ScoreDocument {
  eventId: string;
  teamId: string;
  teamName?: string;
  points: number;
  penalty?: number;
  finalScore: number;
  dayNumber?: number;
  gameNumber?: number;
  gameName?: string;
  notes?: string;
  scorerName?: string;
  createdAt?: FirebaseTimestamp;
  updatedAt?: FirebaseTimestamp;
}

/**
 * Firebase Timestamp type
 */
export interface FirebaseTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Connection state for real-time hooks
 */
export interface ConnectionState {
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

/**
 * Generic hook result with connection state
 */
export interface RealtimeHookResult<T> extends ConnectionState {
  data: T;
  reconnect: () => void;
}
