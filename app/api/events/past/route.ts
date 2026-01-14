import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-client';
import { getEventByToken } from '@/lib/db-access';

/**
 * GET /api/events/past
 * Fetch archived/past events for an admin
 * 
 * Headers:
 *   X-ADMIN-TOKEN: Admin token to verify access
 * 
 * Returns: Array of past events with minimal, read-only data
 * - event_id
 * - name
 * - mode
 * - finalized_at
 * - total_teams
 * - total_days (if camp mode)
 * 
 * Sorted by finalized_at DESC (newest first)
 * 
 * Error responses:
 * - 403: Invalid admin token
 * - 400: Missing admin token header
 * - 200: Success (may return empty array)
 */
export async function GET(request: NextRequest) {
  try {
    // Get admin token from header
    const admin_token = request.headers.get('X-ADMIN-TOKEN');
    
    if (!admin_token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'X-ADMIN-TOKEN header required' 
        },
        { status: 400 }
      );
    }

    // Verify admin token - token must exist in events table
    const adminEvent = await getEventByToken(admin_token, 'admin');
    
    if (!adminEvent) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid admin token' 
        },
        { status: 403 }
      );
    }

    // Fetch past events for this admin
    // Only return events that are archived (is_archived = true)
    const result = await query(
      `
        SELECT 
          e.id as event_id,
          e.name,
          e.mode,
          e.finalized_at,
          e.is_finalized,
          e.public_token,
          COUNT(DISTINCT t.id) as total_teams,
          CASE 
            WHEN e.mode = 'camp' THEN (
              SELECT COUNT(*) 
              FROM event_days 
              WHERE event_id = e.id
            )
            ELSE NULL
          END as total_days,
          (
            SELECT t.name
            FROM teams t
            LEFT JOIN scores s ON s.team_id = t.id
            WHERE t.event_id = e.id
            GROUP BY t.id, t.name
            ORDER BY COALESCE(SUM(s.points), 0) DESC
            LIMIT 1
          ) as winning_team,
          (
            SELECT COALESCE(MAX(team_points), 0)
            FROM (
              SELECT COALESCE(SUM(s.points), 0) AS team_points
              FROM teams t
              LEFT JOIN scores s ON s.team_id = t.id
              WHERE t.event_id = e.id
              GROUP BY t.id
            ) ranked
          ) as winning_points,
          (
            SELECT MAX(s.points)
            FROM scores s
            WHERE s.event_id = e.id
          ) as highest_score,
          (
            SELECT COALESCE(SUM(s.points), 0)
            FROM scores s
            WHERE s.event_id = e.id
          ) as total_points
        FROM events e
        LEFT JOIN teams t ON e.id = t.event_id
        WHERE 
          e.admin_token = $1
          AND e.status = 'archived'
        GROUP BY e.id, e.name, e.mode, e.finalized_at, e.is_finalized, e.public_token
        ORDER BY COALESCE(e.finalized_at, e.updated_at) DESC
      `,
      [admin_token]
    );

    // Format response - convert total_teams to number
    const pastEvents = result.rows.map((row: any) => ({
      event_id: row.event_id,
      name: row.name,
      mode: row.mode,
      finalized_at: row.finalized_at,
      is_finalized: row.is_finalized,
      public_token: row.public_token,
      total_teams: parseInt(row.total_teams) || 0,
      total_days: row.total_days ? parseInt(row.total_days) : null,
      summary: {
        winning_team: row.winning_team || null,
        winning_points: row.winning_points ? parseInt(row.winning_points) : 0,
        highest_score: row.highest_score ? parseInt(row.highest_score) : 0,
        total_points: row.total_points ? parseInt(row.total_points) : 0,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        events: pastEvents,
        count: pastEvents.length,
      },
    });
  } catch (error: any) {
    console.error('[PAST EVENTS API] Error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
    });

    // If DEBUG_API is enabled, include DB error code/detail in the response
    const debug = process.env.DEBUG_API === 'true';

    const responseBody: any = {
      success: false,
      error: error?.message || 'Failed to fetch past events',
    };

    if (debug) {
      responseBody.debug = {
        code: error?.code || null,
        detail: error?.detail || null,
        stack: error?.stack || null,
      };
    }

    return NextResponse.json(responseBody, { status: 500 });
  }
}

/**
 * POST, PUT, DELETE not allowed on past events
 * Archived events are read-only
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Cannot create past events via API. Events are archived automatically.',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'Cannot modify archived events. They are read-only.',
    },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: 'Cannot modify archived events. They are read-only.',
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'Cannot delete archived events. Contact support for data removal.',
    },
    { status: 405 }
  );
}
