/**
 * Score History API
 * Returns chronological list of all score entries with team details
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';
import { query } from '@/lib/db-client';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-scorer-token') || request.headers.get('x-admin-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 401 }
      );
    }

    const { event_id } = params;

    // Verify token has access (scorer or admin)
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;

    if (!event || event.id !== event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or access denied' },
        { status: 403 }
      );
    }

    // Get score history with team details
    const result = await query(
      `SELECT 
        s.id,
        s.event_id,
        s.team_id,
        s.points,
        s.category,
        s.created_at,
        s.updated_at,
        t.name as team_name,
        t.color as team_color,
        d.day_number,
        d.label as day_label
      FROM scores s
      JOIN teams t ON t.id = s.team_id
      LEFT JOIN event_days d ON d.id = s.day_id
      WHERE s.event_id = $1
      ORDER BY s.created_at DESC`,
      [event_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        scores: result.rows,
        total_entries: result.rowCount,
      },
    });
  } catch (error) {
    console.error('Score history error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load history' },
      { status: 500 }
    );
  }
}
