/**
 * Public Scoreboard API
 * Read-only access with public token
 * Returns event details, teams with totals, and scores
 */

import { NextResponse } from 'next/server';
import { 
  getEventByToken, 
  listTeamsWithTotals, 
  listScores,
  listScoresByDay 
} from '@/lib/db-access';

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
        { success: false, error: 'Invalid or expired token' },
        { status: 404 }
      );
    }
    
    // Get teams with computed totals
    const teams = await listTeamsWithTotals(event.id);
    
    // Get all scores
    const scores = await listScores(event.id);
    
    // Get scores by day (for multi-day events)
    const scoresByDay = event.mode === 'camp' 
      ? await listScoresByDay(event.id)
      : [];
    
    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          mode: event.mode,
          status: event.status,
          start_at: event.start_at,
          end_at: event.end_at,
        },
        teams,
        scores,
        scores_by_day: scoresByDay,
      },
    });
  } catch (error) {
    console.error('Public scoreboard error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load scoreboard',
      },
      { status: 500 }
    );
  }
}
