/**
 * Public Scoreboard API
 * GET /api/public/{token}/scores
 *
 * UNAUTHENTICATED - No headers required
 * Returns complete event data with teams, scores, days, and totals
 *
 * Responses:
 * - 200: Success with full event data
 * - 404: Token not found (friendly message)
 * - 410: Event expired (with expiry information)
 * - 500: Server error
 */

import { NextResponse } from 'next/server';
import {
  getEventByToken,
  listTeamsWithTotals,
  listScores,
  listScoresByDay,
  listEventDays,
} from '@/lib/db-access';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Resolve event ONLY via token - no authentication required
    const event = await getEventByToken(token, 'public');

    // Token not found - friendly 404
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          message: 'This event link is invalid or no longer exists. Please check your link and try again.',
        },
        { status: 404 }
      );
    }

    // Event expired - 410 Gone with expiry information
    if (event.status === 'expired') {
      return NextResponse.json(
        {
          success: false,
          error: 'Event expired',
          message: `This event ended on ${new Date(event.expires_at!).toLocaleDateString()} and is no longer available.`,
          expired_at: event.expires_at,
        },
        { status: 410 }
      );
    }

    // Get complete event data in parallel
    const [teams, scores, scoresByDayRaw, daysRaw] = await Promise.all([
      listTeamsWithTotals(event.id),
      listScores(event.id),
      event.mode === 'camp' ? listScoresByDay(event.id) : Promise.resolve([]),
      event.mode === 'camp' ? listEventDays(event.id) : Promise.resolve([]),
    ]);

    // Ensure day labels are never null and map scoresByDay labels
    const days = (daysRaw || []).map((d: any) => ({
      ...d,
      label: d.label || `Day ${d.day_number}`,
    }));

    const scoresByDay = (scoresByDayRaw || []).map((s: any) => ({
      ...s,
      day_label: s.day_label || `Day ${s.day_number}`,
    }));

    // Calculate totals
    const totalPoints = teams.reduce((sum, team) => sum + (team.total_points || 0), 0);
    const totalScores = scores.length;

    // Waiting state: active but no teams/scores yet
    const waiting = event.status === 'active' && teams.length === 0 && totalScores === 0;

    // Return complete event data
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
          is_finalized: event.is_finalized,
          finalized_at: event.finalized_at,
        },
        teams,
        scores,
        scores_by_day: scoresByDay,
        days,
        waiting,
        totals: {
          total_teams: teams.length,
          total_scores: totalScores,
          total_points: totalPoints,
          total_days: days.length,
        },
      },
    });
  } catch (error) {
    console.error('Public scoreboard error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Unable to load scoreboard. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Block all mutations - read-only endpoint
export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}