// lib/db.ts
import { Pool } from 'pg';

// Create a connection pool for direct PostgreSQL connections (Render, Neon, etc.)
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }, // Enable SSL for both dev and production
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout (increased from 2s)
  allowExitOnIdle: true, // Allow pool to close when idle
});

// Helper to convert pg template string syntax to work with pg Pool
async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const client = await pool.connect();
  try {
    // Build the query with $1, $2, etc. placeholders
    let query = strings[0];
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}` + strings[i + 1];
    }
    const result = await client.query(query, values);
    return result;
  } finally {
    client.release();
  }
}

// Export pool for direct database access (used by templates route)
export { pool };

export const db = {
  // User queries
  async createUser(name: string, email: string, passwordHash: string) {
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email, created_at
    `;
    return result.rows[0];
  },

  async findUserByEmail(email: string) {
    const result = await sql`
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE email = ${email}
    `;
    return result.rows[0] || null;
  },

  async findUserById(id: string) {
    const result = await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE id = ${id}
    `;
    return result.rows[0] || null;
  },

  // Event queries
  async createEvent(
    userId: string, 
    eventName: string,
    themeColor: string = 'purple',
    logoUrl: string | null = null,
    allowNegative: boolean = false,
    displayMode: 'cumulative' | 'per_day' = 'cumulative',
    numTeams: number = 3,
    startDate: string | null = null,
    endDate: string | null = null
  ) {
    // TODO: Re-enable start_date and end_date after running migration 001_add_event_dates.sql on Render
    const result = await sql`
      INSERT INTO events (user_id, event_name, theme_color, logo_url, allow_negative, display_mode, num_teams)
      VALUES (${userId}, ${eventName}, ${themeColor}, ${logoUrl}, ${allowNegative}, ${displayMode}, ${numTeams})
      RETURNING id, user_id, event_name, created_at, theme_color, logo_url, allow_negative, display_mode, num_teams
    `;
    return result.rows[0];
  },

  async updateEvent(
    eventId: string,
    updates: {
      event_name?: string;
      theme_color?: string;
      logo_url?: string | null;
      allow_negative?: boolean;
      display_mode?: 'cumulative' | 'per_day';
      num_teams?: number;
    }
  ) {
    // Hardened: Use parameterized queries to prevent SQL injection
    const setClauses = [];
    const values = [eventId];
    let paramIndex = 2;

    if (updates.event_name !== undefined) {
      setClauses.push(`event_name = $${paramIndex++}`);
      values.push(updates.event_name);
    }
    if (updates.brand_color !== undefined) {
      setClauses.push(`brand_color = $${paramIndex++}`);
      values.push(updates.brand_color);
    }
    if (updates.logo_url !== undefined) {
      setClauses.push(`logo_url = $${paramIndex++}`);
      values.push(updates.logo_url);
    }
    if (updates.allow_negative !== undefined) {
      setClauses.push(`allow_negative = $${paramIndex++}`);
      values.push(updates.allow_negative);
    }
    if (updates.display_mode !== undefined) {
      setClauses.push(`display_mode = $${paramIndex++}`);
      values.push(updates.display_mode);
    }
    if (updates.num_teams !== undefined) {
      setClauses.push(`num_teams = $${paramIndex++}`);
      values.push(updates.num_teams);
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE events
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id, user_id, event_name, created_at, brand_color, logo_url, allow_negative, display_mode, num_teams
    `;
    const result = await sql.query(query, values);
    return result.rows[0] || null;
  },

  async listEventsByUser(userId: string) {
    const result = await sql`
      SELECT id, user_id, event_name, created_at, brand_color, logo_url, allow_negative, display_mode, num_teams
      FROM events
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result.rows;
  },

  async getEventById(eventId: string) {
    const result = await sql`
      SELECT id, user_id, event_name, created_at, brand_color, logo_url, allow_negative, display_mode, num_teams
      FROM events
      WHERE id = ${eventId}
    `;
    return result.rows[0] || null;
  },

  // Team queries
  async createTeam(eventId: string, teamName: string, avatarUrl: string | null = null) {
    const result = await sql`
      INSERT INTO teams (event_id, team_name, avatar_url)
      VALUES (${eventId}, ${teamName}, ${avatarUrl})
      RETURNING id, event_id, team_name, avatar_url, total_points
    `;
    return result.rows[0];
  },

  async listTeamsByEvent(eventId: string) {
    const result = await sql`
      SELECT id, event_id, team_name, avatar_url, total_points
      FROM teams
      WHERE event_id = ${eventId}
      ORDER BY total_points DESC, team_name ASC
    `;
    return result.rows;
  },

  async getTeamById(teamId: string) {
    const result = await sql`
      SELECT id, event_id, team_name, avatar_url, total_points
      FROM teams
      WHERE id = ${teamId}
    `;
    return result.rows[0] || null;
  },

  // Game score queries
  // Atomic upsert for game scores (prevents race conditions and duplicates)
  async addGameScore(eventId: string, teamId: string, gameNumber: number, points: number, submissionId?: string) {
    const result = await sql`
      INSERT INTO game_scores (event_id, team_id, game_number, points, submission_id)
      VALUES (${eventId}, ${teamId}, ${gameNumber}, ${points}, ${submissionId || null})
      ON CONFLICT (team_id, game_number, event_id)
      DO UPDATE SET 
        points = EXCLUDED.points,
        edited_at = CURRENT_TIMESTAMP,
        submission_id = COALESCE(EXCLUDED.submission_id, game_scores.submission_id)
      RETURNING id, event_id, team_id, game_number, points, created_at, edited_at, submission_id
    `;
    return result.rows[0];
  },

  // Upsert score (insert or update) - single correct version
  async upsertGameScore(eventId: string, teamId: string, gameNumber: number, points: number, submissionId?: string) {
    const result = await sql`
      INSERT INTO game_scores (event_id, team_id, game_number, points, submission_id)
      VALUES (${eventId}, ${teamId}, ${gameNumber}, ${points}, ${submissionId || null})
      ON CONFLICT (team_id, game_number, event_id)
      DO UPDATE SET 
        points = EXCLUDED.points,
        edited_at = CURRENT_TIMESTAMP,
        submission_id = COALESCE(EXCLUDED.submission_id, game_scores.submission_id)
      RETURNING id, event_id, team_id, game_number, points, created_at, edited_at, submission_id
    `;
    return result.rows[0];
  },

  // Recalculate team total (backup method if triggers fail)
  async recalculateTeamTotal(teamId: string) {
    const result = await sql`
      UPDATE teams
      SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM game_scores
        WHERE team_id = ${teamId}
      )
      WHERE id = ${teamId}
      RETURNING total_points
    `;
    return result.rows[0];
  },

  async getScoresByEvent(eventId: string) {
    const result = await sql`
      SELECT 
        gs.id,
        gs.event_id,
        gs.team_id,
        gs.game_number,
        gs.points,
        gs.created_at,
        t.team_name,
        t.avatar_url
      FROM game_scores gs
      JOIN teams t ON gs.team_id = t.id
      WHERE gs.event_id = ${eventId}
      ORDER BY gs.game_number ASC, gs.created_at ASC
    `;
    return result.rows;
  },

  async getScoresByTeam(teamId: string) {
    const result = await sql`
      SELECT id, event_id, team_id, game_number, points, created_at
      FROM game_scores
      WHERE team_id = ${teamId}
      ORDER BY game_number ASC
    `;
    return result.rows;
  },

  // Share link queries
  async createShareLink(eventId: string, token: string) {
    const result = await sql`
      INSERT INTO share_links (event_id, token)
      VALUES (${eventId}, ${token})
      RETURNING id, event_id, token, created_at
    `;
    return result.rows[0];
  },

  async findShareLinkByToken(token: string) {
    const result = await sql`
      SELECT id, event_id, token, created_at
      FROM share_links
      WHERE token = ${token}
    `;
    return result.rows[0] || null;
  },

  async getShareLinkByEvent(eventId: string) {
    const result = await sql`
      SELECT id, event_id, token, created_at
      FROM share_links
      WHERE event_id = ${eventId}
      LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async getShareLinkByEventId(eventId: string) {
    return this.getShareLinkByEvent(eventId);
  },

  async deleteShareLink(eventId: string) {
    const result = await sql`
      DELETE FROM share_links
      WHERE event_id = ${eventId}
      RETURNING id
    `;
    return result.rows[0] || null;
  },

  async upsertGameScore(
    eventId: string,
    teamId: string,
    gameNumber: number,
    points: number,
    submissionId?: string
  ) {
    const result = await sql`
      INSERT INTO game_scores (event_id, team_id, game_number, points, submission_id)
      VALUES (${eventId}, ${teamId}, ${gameNumber}, ${points}, ${submissionId || null})
      ON CONFLICT (event_id, team_id, game_number)
      DO UPDATE SET 
        points = EXCLUDED.points,
        edited_at = CURRENT_TIMESTAMP,
        submission_id = COALESCE(EXCLUDED.submission_id, game_scores.submission_id)
      RETURNING id, event_id, team_id, game_number, points, created_at, edited_at, submission_id
    `;
    return result.rows[0];
  },

  async getGameHistory(
    eventId: string,
    options: {
      page?: number;
      limit?: number;
      teamId?: string;
      gameNumber?: number;
    } = {}
  ) {
    const { page = 1, limit = 50, teamId, gameNumber } = options;
    const offset = (page - 1) * limit;

    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM game_scores gs
      WHERE gs.event_id = ${eventId}
      ${teamId ? sql`AND gs.team_id = ${teamId}` : sql``}
      ${gameNumber !== undefined ? sql`AND gs.game_number = ${gameNumber}` : sql``}
    `;

    const result = await sql`
      SELECT 
        gs.id,
        gs.event_id,
        gs.team_id,
        gs.game_number,
        gs.points,
        gs.created_at,
        gs.edited_at,
        gs.submission_id,
        t.team_name,
        t.avatar_url
      FROM game_scores gs
      JOIN teams t ON gs.team_id = t.id
      WHERE gs.event_id = ${eventId}
      ${teamId ? sql`AND gs.team_id = ${teamId}` : sql``}
      ${gameNumber !== undefined ? sql`AND gs.game_number = ${gameNumber}` : sql``}
      ORDER BY gs.created_at DESC, gs.game_number DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return {
      scores: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    };
  },

  // Public scoreboard query
  async getPublicScoreboard(eventId: string) {
    const eventResult = await sql`
      SELECT id, event_name, created_at, brand_color, logo_url, display_mode, allow_negative
      FROM events
      WHERE id = ${eventId}
    `;

    const teamsResult = await sql`
      SELECT id, team_name, avatar_url, total_points
      FROM teams
      WHERE event_id = ${eventId}
      ORDER BY total_points DESC, team_name ASC
    `;

    const scoresResult = await sql`
      SELECT 
        gs.id,
        gs.team_id,
        gs.game_number,
        gs.points,
        gs.created_at,
        t.team_name
      FROM game_scores gs
      JOIN teams t ON gs.team_id = t.id
      WHERE gs.event_id = ${eventId}
      ORDER BY gs.game_number ASC, gs.created_at ASC
    `;

    return {
      event: eventResult.rows[0] || null,
      teams: teamsResult.rows,
      scores: scoresResult.rows,
    };
  },

  // ============ Authentication & Security Functions ============

  // Refresh Token Management
  async createRefreshToken(userId: string, token: string, expiresAt: Date, userAgent?: string, ipAddress?: string) {
    const result = await sql`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at, user_agent, ip_address)
      VALUES (gen_random_uuid()::text, ${userId}, ${token}, ${expiresAt.toISOString()}, ${userAgent || null}, ${ipAddress || null})
      RETURNING id, user_id, token, expires_at, created_at
    `;
    return result.rows[0];
  },

  async findRefreshToken(token: string) {
    const result = await sql`
      SELECT id, user_id, token, expires_at, revoked, last_used_at
      FROM refresh_tokens
      WHERE token = ${token} AND revoked = FALSE AND expires_at > NOW()
    `;
    return result.rows[0] || null;
  },

  async updateRefreshTokenUsage(tokenId: string) {
    await sql`
      UPDATE refresh_tokens
      SET last_used_at = NOW()
      WHERE id = ${tokenId}
    `;
  },

  async revokeRefreshToken(token: string) {
    await sql`
      UPDATE refresh_tokens
      SET revoked = TRUE, revoked_at = NOW()
      WHERE token = ${token}
    `;
  },

  async revokeAllUserRefreshTokens(userId: string) {
    await sql`
      UPDATE refresh_tokens
      SET revoked = TRUE, revoked_at = NOW()
      WHERE user_id = ${userId} AND revoked = FALSE
    `;
  },

  // Email Verification
  async setVerificationToken(userId: string, token: string, expiresAt: Date) {
    await sql`
      UPDATE users
      SET verification_token = ${token}, verification_token_expires = ${expiresAt.toISOString()}
      WHERE id = ${userId}
    `;
  },

  async verifyEmail(token: string) {
    const result = await sql`
      UPDATE users
      SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
      WHERE verification_token = ${token} AND verification_token_expires > NOW()
      RETURNING id, email
    `;
    return result.rows[0] || null;
  },

  // Password Reset
  async setPasswordResetToken(email: string, token: string, expiresAt: Date) {
    await sql`
      UPDATE users
      SET password_reset_token = ${token}, password_reset_expires = ${expiresAt.toISOString()}
      WHERE email = ${email}
    `;
  },

  async findUserByResetToken(token: string) {
    const result = await sql`
      SELECT id, email
      FROM users
      WHERE password_reset_token = ${token} AND password_reset_expires > NOW()
    `;
    return result.rows[0] || null;
  },

  async resetPassword(userId: string, newPasswordHash: string) {
    await sql`
      UPDATE users
      SET password_hash = ${newPasswordHash}, 
          password_reset_token = NULL, 
          password_reset_expires = NULL
      WHERE id = ${userId}
    `;
  },

  // Account Lockout
  async incrementFailedLoginAttempts(email: string) {
    const result = await sql`
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
            ELSE locked_until
          END
      WHERE email = ${email}
      RETURNING failed_login_attempts, locked_until
    `;
    return result.rows[0];
  },

  async resetFailedLoginAttempts(email: string) {
    await sql`
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE email = ${email}
    `;
  },

  async isAccountLocked(email: string): Promise<boolean> {
    const result = await sql`
      SELECT locked_until
      FROM users
      WHERE email = ${email}
    `;
    
    if (!result.rows[0]?.locked_until) return false;
    
    const lockedUntil = new Date(result.rows[0].locked_until);
    return lockedUntil > new Date();
  },

  // Update last login
  async updateLastLogin(userId: string, ipAddress?: string) {
    await sql`
      UPDATE users
      SET last_login_at = NOW(), last_login_ip = ${ipAddress || null}
      WHERE id = ${userId}
    `;
  },

  // Audit Logging
  async createAuditLog(
    userId: string | null,
    eventType: string,
    eventStatus: 'success' | 'failure',
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ) {
    await sql`
      INSERT INTO audit_logs (id, user_id, event_type, event_status, ip_address, user_agent, details)
      VALUES (gen_random_uuid()::text, ${userId}, ${eventType}, ${eventStatus}, ${ipAddress || null}, ${userAgent || null}, ${JSON.stringify(details || {})})
    `;
  },

  async getAuditLogs(userId?: string, limit: number = 100) {
    if (userId) {
      const result = await sql`
        SELECT * FROM audit_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result.rows;
    }
    
    const result = await sql`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  },

  // Session Management
  async createSession(userId: string, refreshTokenId: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    const result = await sql`
      INSERT INTO user_sessions (id, user_id, refresh_token_id, expires_at, ip_address, user_agent)
      VALUES (gen_random_uuid()::text, ${userId}, ${refreshTokenId}, ${expiresAt.toISOString()}, ${ipAddress || null}, ${userAgent || null})
      RETURNING id
    `;
    return result.rows[0];
  },

  async updateSessionActivity(sessionId: string) {
    await sql`
      UPDATE user_sessions
      SET last_activity_at = NOW()
      WHERE id = ${sessionId}
    `;
  },

  async deactivateSession(sessionId: string) {
    await sql`
      UPDATE user_sessions
      SET is_active = FALSE
      WHERE id = ${sessionId}
    `;
  },

  async getActiveSessions(userId: string) {
    const result = await sql`
      SELECT id, created_at, last_activity_at, ip_address, user_agent
      FROM user_sessions
      WHERE user_id = ${userId} AND is_active = TRUE AND expires_at > NOW()
      ORDER BY last_activity_at DESC
    `;
    return result.rows;
  },

  // Public Events - Get all active events with share links
  async getPublicEvents() {
    const result = await sql`
      SELECT 
        e.id,
        e.event_name,
        e.theme_color,
        e.logo_url,
        e.created_at,
        COUNT(t.id) as team_count,
        sl.token as share_token
      FROM events e
      INNER JOIN share_links sl ON e.id = sl.event_id
      LEFT JOIN teams t ON e.id = t.event_id
      WHERE e.status = 'active' OR e.status IS NULL
      GROUP BY e.id, e.event_name, e.theme_color, e.logo_url, e.created_at, sl.token
      ORDER BY e.created_at DESC
    `;
    return result.rows;
  },

  // Delete Event (cascade delete teams, scores, share_links)
  async deleteEvent(eventId: string) {
    const result = await sql`
      DELETE FROM events
      WHERE id = ${eventId}
      RETURNING id
    `;
    return result.rows[0] || null;
  },
  
  // Export pool for direct access
  pool,
};

// Standalone helper functions for API routes
export async function getTeamsForEvent(eventId: number) {
  return db.listTeamsByEvent(eventId.toString());
}

export async function addScore(
  teamId: number,
  gameNumber: number,
  points: number,
  addedBy: string,
  gameName: string | null
) {
  // First get the event_id from the team
  const team = await db.getTeamById(teamId.toString());
  if (!team) {
    throw new Error('Team not found');
  }

  // Insert the score with added_by and game_name
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO game_scores (event_id, team_id, game_number, points, added_by, game_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, event_id, team_id, game_number, points, added_by, game_name, created_at, is_edited`,
      [team.event_id, teamId, gameNumber, points, addedBy, gameName]
    );

    // Update team total
    await db.recalculateTeamTotal(teamId.toString());

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function getEventHistory(eventId: number) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 
        gs.id,
        gs.game_number,
        gs.game_name,
        gs.points,
        t.team_name,
        gs.added_by,
        gs.created_at,
        gs.is_edited,
        gs.updated_at
       FROM game_scores gs
       JOIN teams t ON gs.team_id = t.id
       WHERE gs.event_id = $1
       ORDER BY gs.created_at DESC`,
      [eventId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function getShareLinkByEventId(eventId: number) {
  return db.getShareLinkByEvent(eventId.toString());
}

export async function createOrUpdateShareLink(
  eventId: number,
  userId: number,
  regenerate: boolean = false
) {
  const client = await pool.connect();
  try {
    // Check if a share link already exists
    const existing = await db.getShareLinkByEvent(eventId.toString());

    if (existing && !regenerate) {
      return existing;
    }

    // Generate a unique token
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    if (existing && regenerate) {
      // Update existing link
      const result = await client.query(
        `UPDATE share_links 
         SET token = $1, created_at = NOW(), view_count = 0, last_viewed_at = NULL
         WHERE event_id = $2
         RETURNING id, event_id, token as share_token, is_active, view_count, created_at, last_viewed_at`,
        [token, eventId]
      );
      return result.rows[0];
    } else {
      // Create new link
      const result = await client.query(
        `INSERT INTO share_links (event_id, token, is_active)
         VALUES ($1, $2, true)
         RETURNING id, event_id, token as share_token, is_active, view_count, created_at, last_viewed_at`,
        [eventId, token]
      );
      return result.rows[0];
    }
  } finally {
    client.release();
  }
}

export async function deleteShareLink(eventId: number) {
  return db.deleteShareLink(eventId.toString());
}

// Template helpers
export async function getTemplateById(templateId: number, userId: number) {
  const result = await sql`
    SELECT template_id, user_id, template_name, event_name_prefix, 
           theme_color, logo_url, allow_negative, display_mode, created_at
    FROM event_templates
    WHERE template_id = ${templateId} AND user_id = ${userId}
  `;
  return result.rows[0] || null;
}
