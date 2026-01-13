/**
 * Score History API
 * Returns chronological list of all score entries with team details
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';
import { query } from '@/lib/db-client';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-admin-token') || request.headers.get('x-scorer-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    const { event_id } = params;

    // SECURITY: history listing and edit/delete must be admin-only.
    // Only accept admin tokens here to prevent scorer tokens from accessing edits.
    const eventByAdmin = await getEventByToken(token, 'admin');

    if (!eventByAdmin || eventByAdmin.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }

    const event = eventByAdmin;

    // Expired events should return 410
    if (event.status === 'expired') {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Event expired'),
        { status: 410 }
      );
    }

    // Get score history with team details
    // Use LEFT JOIN for teams to prevent crashes if team is deleted
    // Always provide fallback values for UI safety
    const result = await query(
      `SELECT 
        s.id,
        s.event_id,
        s.team_id,
        s.day_id,
        s.points,
        s.category,
        s.created_at,
        COALESCE(t.name, 'Unknown Team') as team_name,
        COALESCE(t.color, '#6B7280') as team_color,
        d.day_number,
        d.label as day_label
      FROM scores s
      LEFT JOIN teams t ON t.id = s.team_id
      LEFT JOIN event_days d ON d.id = s.day_id
      WHERE s.event_id = $1
      ORDER BY s.created_at DESC`,
      [event_id]
    );

    return NextResponse.json(
      successResponse({ scores: result.rows, total_entries: result.rowCount }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Score history error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to load history'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
