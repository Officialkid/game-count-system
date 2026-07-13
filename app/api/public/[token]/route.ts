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
import { calculateTeamTotal, getPublicEventByToken } from '@/lib/server/event-lifecycle-service';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    const access = await getPublicEventByToken(token);

    if (!access) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event not found',
          message: 'This event link is invalid or no longer exists. Please check your link and try again.'
        },
        { status: 404 }
      );
    }
    
    const event = access.event;
    
    // Event expired - 410 Gone with expiry information
    if (event.eventStatus === 'archived') {
      const expiryDate = event.endAt ? new Date(event.endAt).toLocaleDateString() : 'recently';
      return NextResponse.json(
        {
          success: false,
          error: 'Event expired',
          message: `This event ended ${expiryDate !== 'recently' ? `on ${expiryDate}` : expiryDate} and is no longer available.`,
          expired_at: event.endAt,
        },
        { status: 410 }
      );
    }

    const teams = event.teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      avatar_url: team.avatarUrl,
      total_points: calculateTeamTotal(team.scores),
    }));

    const scores = event.teams
      .flatMap((team) =>
        team.scores.map((score) => ({
          id: score.id,
          team_id: team.id,
          team_name: team.name,
          points: score.points,
          penalty: score.penalty,
          bonus: score.bonus,
          notes: score.notes,
          day_number: score.eventDay?.dayNumber ?? null,
          created_at: score.createdAt.toISOString(),
        }))
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const days = event.eventDays.map((day) => ({
      day_number: day.dayNumber,
      label: day.label || `Day ${day.dayNumber}`,
      is_locked: day.isLocked,
    }));

    const groupedByDay = new Map<number, typeof scores>();
    for (const score of scores) {
      if (!score.day_number) continue;
      if (!groupedByDay.has(score.day_number)) {
        groupedByDay.set(score.day_number, []);
      }
      groupedByDay.get(score.day_number)!.push(score);
    }

    const scoresByDay = Array.from(groupedByDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayNumber, dayScores]) => ({
        day_number: dayNumber,
        day_label: days.find((day) => day.day_number === dayNumber)?.label || `Day ${dayNumber}`,
        scores: dayScores,
      }));
    
    // Calculate totals
    const totalPoints = teams.reduce(
      (sum: number, team: any) => sum + (team.total_points || 0),
      0
    );
    const totalScores = scores.length;

    const waiting = event.eventStatus === 'active' && teams.length === 0 && totalScores === 0;
    
    // Return complete event data
    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          mode: event.eventMode,
          status: event.eventStatus,
          startDate: event.startAt.toISOString(),
          endDate: event.endAt.toISOString(),
          isFinalized: event.isFinalized,
          finalizedAt: event.finalizedAt?.toISOString() ?? null,
        },
        teams,
        scores,
        scores_by_day: scoresByDay,
        days: days,
        waiting,
        totals: {
          total_teams: teams.length,
          total_scores: totalScores,
          total_points: totalPoints,
          total_days: days.length,
        }
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
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
