/**
 * Public Scoreboard
 * GET /events/{public_token}
 * Read-only access - no authentication required
 * Returns event details, teams with totals, and day-by-day breakdown
 */

import { NextResponse } from 'next/server';
import { 
  getEventByToken, 
  listTeamsWithTotals, 
  listScores,
  listEventDays,
  listScoresByDay 
} from '@/lib/db-access';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Verify public token
    const event = await getEventByToken(token, 'public');
    
    if (!event) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Invalid or expired token'),
        { status: ERROR_STATUS_MAP.NOT_FOUND }
      );
    }
    
    // Get teams with computed totals
    const teams = await listTeamsWithTotals(event.id);
    
    // Get event days (for multi-day events)
    const days = await listEventDays(event.id);
    
    // Build day-by-day breakdown
    const breakdown: Record<string, any[]> = {};
    
    if (event.mode === 'camp' || event.mode === 'advanced') {
      const scoresByDay = await listScoresByDay(event.id);
      
      // Group scores by day
      scoresByDay.forEach((score) => {
        const dayKey = `day_${score.day_number}`;
        if (!breakdown[dayKey]) {
          breakdown[dayKey] = [];
        }
        breakdown[dayKey].push({
          team_name: score.team_name,
          points: score.points,
        });
      });
    }
    
    return NextResponse.json(
      successResponse({
        event: {
          id: event.id,
          name: event.name,
          mode: event.mode,
          status: event.status,
          start_at: event.start_at,
          end_at: event.end_at,
        },
        days: days.map((d) => ({
          day_number: d.day_number,
          label: d.label,
          is_locked: d.is_locked,
        })),
        teams: teams.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          avatar_url: t.avatar_url,
          total_points: t.total_points,
        })),
        breakdown,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Public scoreboard error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to load scoreboard'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
