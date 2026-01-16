/**
 * Get or create an event day, ensuring label is never null and table exists.
 * Throws a controlled error if event_days table is missing.
 */
export async function getOrCreateEventDay(event_id: string, day_number: number): Promise<EventDay> {
  // Check if event_days table exists
  try {
    const tableCheck = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'event_days'
      ) AS exists`
    );
    if (!tableCheck.rows[0]?.exists) {
      const err: any = new Error('event_days table is missing');
      err.status = 500;
      err.code = 'TABLE_MISSING';
      throw err;
    }
  } catch (err: any) {
    if (err.code === 'TABLE_MISSING') throw err;
    // If query itself fails, treat as missing table
    const error: any = new Error('event_days table is missing or inaccessible');
    error.status = 500;
    error.code = 'TABLE_MISSING';
    throw error;
  }

  // Try to get the day
  let day = await getEventDay(event_id, day_number);
  if (!day) {
    // Always use default label format
    day = await createDayIfNotExists({
      event_id,
      day_number,
      label: `Day ${day_number}`,
    });
  } else if (!day.label) {
    // Patch label if missing
    day = await createDayIfNotExists({
      event_id,
      day_number,
      label: `Day ${day_number}`,
    });
  }
  return day;
}
/**
 * Data Access Layer
 * All database operations for GameScore
 * Token-based, event-scoped, no user auth
 */

import { query, transaction } from './db-client';
import { generateEventTokens } from './tokens';
import {
  CreateEventInput,
  UpdateEventInput,
  CreateEventDayInput,
  CreateTeamInput,
  UpdateTeamInput,
  CreateScoreInput,
} from './db-validations';

// ============================================
// EVENT OPERATIONS
// ============================================

export interface Event {
  id: string;
  name: string;
  mode: 'quick' | 'camp' | 'advanced';
  start_at: Date;
  end_at: Date | null;
  retention_policy: 'auto_expire' | 'manual' | 'archive';
  expires_at: Date | null;
  admin_token: string;
  scorer_token: string;
  public_token: string;
  status: 'active' | 'completed' | 'expired' | 'archived';
  is_finalized: boolean;
  finalized_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new event with generated tokens
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  console.log('[DB-ACCESS] createEvent called with input:', JSON.stringify(input, null, 2));
  
  let tokens;
  try {
    tokens = generateEventTokens();
    console.log('[DB-ACCESS] Generated tokens:', {
      admin: tokens.admin_token.substring(0, 8) + '...',
      scorer: tokens.scorer_token.substring(0, 8) + '...',
      public: tokens.public_token.substring(0, 8) + '...',
    });
  } catch (tokenError: any) {
    console.error('[DB-ACCESS] Token generation failed:', tokenError);
    throw new Error(`Token generation failed: ${tokenError.message}`);
  }
  
  try {
    console.log('[DB-ACCESS] Executing INSERT query...');
    const result = await query<Event>(
      `INSERT INTO events (
        name, mode, start_at, end_at, retention_policy, expires_at,
        admin_token, scorer_token, public_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        input.name,
        input.mode,
        input.start_at,
        input.end_at || null,
        input.retention_policy,
        input.expires_at || null,
        tokens.admin_token,
        tokens.scorer_token,
        tokens.public_token,
      ]
    );
    
    console.log('[DB-ACCESS] INSERT successful, rows returned:', result.rowCount);
    
    if (!result.rows[0]) {
      throw new Error('No event returned from INSERT query');
    }
    
    return result.rows[0];
  } catch (dbError: any) {
    console.error('[DB-ACCESS] Database INSERT failed:', {
      message: dbError?.message,
      code: dbError?.code,
      detail: dbError?.detail,
      hint: dbError?.hint,
      position: dbError?.position,
    });
    throw dbError;
  }
}

/**
 * Get event by any token type
 */
export async function getEventByToken(
  token: string,
  tokenType: 'admin' | 'scorer' | 'public' = 'public'
): Promise<Event | null> {
  const columnMap = {
    admin: 'admin_token',
    scorer: 'scorer_token',
    public: 'public_token',
  };
  
  const result = await query<Event>(
    `SELECT * FROM events WHERE ${columnMap[tokenType]} = $1`,
    [token]
  );
  
  return result.rows[0] || null;
}

/**
 * Get event by ID (server-side only, no token required)
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const result = await query<Event>(
    `SELECT * FROM events WHERE id = $1`,
    [eventId]
  );
  
  return result.rows[0] || null;
}

/**
 * Update event (requires admin token validation before calling)
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<Event> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }
  if (input.end_at !== undefined) {
    fields.push(`end_at = $${paramIndex++}`);
    values.push(input.end_at);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(eventId);
  
  const result = await query<Event>(
    `UPDATE events SET ${fields.join(', ')}, updated_at = now()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  if (result.rowCount === 0) {
    throw new Error('Event not found');
  }
  
  return result.rows[0];
}

/**
 * Delete event and all related data (CASCADE)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await query(`DELETE FROM events WHERE id = $1`, [eventId]);
}

// ============================================
// EVENT DAY OPERATIONS
// ============================================

export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  label: string | null;
  is_locked: boolean;
  created_at: Date;
}

/**
 * Create event day if it doesn't exist
 */
export async function createDayIfNotExists(
  input: CreateEventDayInput
): Promise<EventDay> {
  // Generate a default label if none is provided to satisfy NOT NULL constraint
  const label = input.label || `Day ${input.day_number}`;
  
  const result = await query<EventDay>(
    `INSERT INTO event_days (event_id, day_number, label)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, day_number) DO UPDATE
     SET label = COALESCE(EXCLUDED.label, event_days.label)
     RETURNING *`,
    [input.event_id, input.day_number, label]
  );
  
  return result.rows[0];
}

/**
 * Get event day by event and day number
 */
export async function getEventDay(
  eventId: string,
  dayNumber: number
): Promise<EventDay | null> {
  const result = await query<EventDay>(
    `SELECT * FROM event_days WHERE event_id = $1 AND day_number = $2`,
    [eventId, dayNumber]
  );
  
  return result.rows[0] || null;
}

/**
 * Lock or unlock an event day (requires admin token)
 */
export async function lockEventDay(
  dayId: string,
  isLocked: boolean
): Promise<EventDay> {
  const result = await query<EventDay>(
    `UPDATE event_days SET is_locked = $1 WHERE id = $2 RETURNING *`,
    [isLocked, dayId]
  );
  
  if (result.rowCount === 0) {
    throw new Error('Event day not found');
  }
  
  return result.rows[0];
}

/**
 * List all days for an event
 */
export async function listEventDays(eventId: string): Promise<EventDay[]> {
  const result = await query<EventDay>(
    `SELECT * FROM event_days WHERE event_id = $1 ORDER BY day_number ASC`,
    [eventId]
  );
  
  return result.rows;
}

// ============================================
// TEAM OPERATIONS
// ============================================

export interface Team {
  id: string;
  event_id: string;
  name: string;
  color: string | null;
  avatar_url: string | null;
  created_at: Date;
}

export interface TeamWithTotal extends Team {
  total_points: number;
}

/**
 * Add team to event
 */
export async function addTeam(input: CreateTeamInput): Promise<Team> {
  try {
    const result = await query<Team>(
      `INSERT INTO teams (event_id, name, color, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.event_id, input.name, input.color || null, input.avatar_url || null]
    );
    
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Team name already exists in this event');
    }
    throw error;
  }
}

/**
 * Update team
 */
export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput
): Promise<Team> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(input.color);
  }
  if (input.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(input.avatar_url);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(teamId);
  
  const result = await query<Team>(
    `UPDATE teams SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (result.rowCount === 0) {
    throw new Error('Team not found');
  }
  
  return result.rows[0];
}

/**
 * Delete team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await query(`DELETE FROM teams WHERE id = $1`, [teamId]);
}

/**
 * List teams with computed totals
 */
export async function listTeamsWithTotals(
  eventId: string
): Promise<TeamWithTotal[]> {
  const result = await query<TeamWithTotal>(
    `SELECT 
      t.id,
      t.event_id,
      t.name,
      t.color,
      t.avatar_url,
      t.created_at,
      COALESCE(SUM(s.points), 0) AS total_points
    FROM teams t
    LEFT JOIN scores s ON s.team_id = t.id
    WHERE t.event_id = $1
    GROUP BY t.id
    ORDER BY total_points DESC, t.name ASC`,
    [eventId]
  );
  
  return result.rows;
}

// ============================================
// SCORE OPERATIONS
// ============================================

export interface Score {
  id: string;
  event_id: string;
  day_id: string | null;
  team_id: string;
  category: string;
  points: number;
  created_at: Date;
}

export interface ScoreWithTeam extends Score {
  team_name: string;
}

export interface ScoreByDay {
  day_number: number;
  day_label: string | null;
  team_name: string;
  points: number;
}

/**
 * Add score to team
 */
export async function addScore(input: CreateScoreInput): Promise<Score> {
  // Defensive: Check event_days table and columns if day_id provided
  if (input.day_id) {
    try {
      // Check if event_days table exists
      const tableCheck = await query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'event_days'
        ) AS exists`
      );
      if (!tableCheck.rows[0]?.exists) {
        const err: any = new Error('event_days table is missing');
        err.status = 500;
        err.code = 'TABLE_MISSING';
        throw err;
      }
      // Check if columns exist
      const colCheck = await query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'event_days' AND column_name IN ('is_locked','label')`
      );
      const colNames = colCheck.rows.map(r => r.column_name);
      if (!colNames.includes('is_locked')) {
        const err: any = new Error('event_days.is_locked column is missing');
        err.status = 500;
        err.code = 'COLUMN_MISSING';
        throw err;
      }
      // Check if day is locked
      const dayCheck = await query<{ is_locked: boolean }>(
        `SELECT is_locked FROM event_days WHERE id = $1`,
        [input.day_id]
      );
      if (dayCheck.rows[0]?.is_locked) {
        throw new Error('Cannot add scores to a locked day');
      }
    } catch (err) {
      throw err;
    }
  }

  // Ensure team exists and belongs to the event to provide clearer errors
  const teamCheck = await query<{ id: string; event_id: string }>(
    `SELECT id, event_id FROM teams WHERE id = $1`,
    [input.team_id]
  );

  if (!teamCheck.rows[0]) {
    throw new Error('Team not found');
  }

  if (teamCheck.rows[0].event_id !== input.event_id) {
    throw new Error('Team does not belong to the specified event');
  }

  // Only wrap the DB insert in try/catch for DB errors
  try {
    const result = await query<Score>(
      `INSERT INTO scores (event_id, day_id, team_id, category, points)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.event_id,
        input.day_id || null,
        input.team_id,
        input.category,
        input.points,
      ]
    );
    return result.rows[0];
  } catch (err: any) {
    console.error('[SCORES][DB ERROR]', err);
    if (err?.code === '23503') {
      // Foreign key violation
      const error: any = new Error('Invalid reference: team or day not found');
      error.status = 409;
      throw error;
    }
    if (err?.code === '23514' && /points/.test(err?.message || '')) {
      // DB check constraint on points
      const error: any = new Error('Points value not allowed by DB constraint');
      error.status = 400;
      throw error;
    }
    const error: any = new Error('Failed to record score');
    error.status = 400;
    throw error;
  }
}

/**
 * List all scores for an event
 */
export async function listScores(eventId: string): Promise<ScoreWithTeam[]> {
  const result = await query<ScoreWithTeam>(
    `SELECT 
      s.*,
      t.name AS team_name
    FROM scores s
    JOIN teams t ON t.id = s.team_id
    WHERE s.event_id = $1
    ORDER BY s.created_at DESC`,
    [eventId]
  );
  
  return result.rows;
}

/**
 * List scores grouped by day
 */
export async function listScoresByDay(eventId: string): Promise<ScoreByDay[]> {
  const result = await query<ScoreByDay>(
    `SELECT 
      d.day_number,
      d.label AS day_label,
      t.name AS team_name,
      SUM(s.points) AS points
    FROM scores s
    JOIN teams t ON t.id = s.team_id
    LEFT JOIN event_days d ON d.id = s.day_id
    WHERE s.event_id = $1
    GROUP BY d.day_number, d.label, t.name
    ORDER BY d.day_number ASC, points DESC`,
    [eventId]
  );
  
  return result.rows;
}

/**
 * Delete score
 */
export async function deleteScore(scoreId: string): Promise<void> {
  await query(`DELETE FROM scores WHERE id = $1`, [scoreId]);
}

// ============================================
// CLEANUP OPERATIONS
// ============================================

/**
 * Delete expired events (for cron job)
 */
export async function cleanupExpiredEvents(): Promise<number> {
  const result = await query(
    `DELETE FROM events
     WHERE retention_policy = 'auto_expire'
     AND expires_at < NOW()
     AND status != 'archived'`
  );
  
  return result.rowCount;
}

/**
 * Mark events as expired (status update, no deletion)
 */
export async function markExpiredEvents(): Promise<number> {
  const result = await query(
    `UPDATE events
     SET status = 'expired'
     WHERE retention_policy = 'auto_expire'
     AND expires_at < NOW()
     AND status = 'active'`
  );
  
  return result.rowCount;
}
