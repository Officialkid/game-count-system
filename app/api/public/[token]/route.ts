/**
 * Public Scoreboard API
 * GET /api/public/{token}
 *
 * UNAUTHENTICATED — Read-only live scoreboard data.
 * Returns:
 * - active_day_number & labeled days (with carry_over_from_previous & is_locked)
 * - overall_standings (ranked cumulative totals across all days)
 * - day_standings (per-day ranked totals so Day 2 Leader & Overall Leader are both shown!)
 * - recent_activity (games & deductions feed, respecting show_public_activity)
 */

import { NextResponse } from 'next/server';
import { calculateTeamTotal, getPublicEventByToken } from '@/lib/server/event-lifecycle-service';
import { withDbRetry } from '@/lib/server/prisma';

export const dynamic = 'force-dynamic';

type RankedTeam = {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  points: number;
  overall_points: number;
  rank: number;
};

function rankTeams(
  entries: Array<{
    id: string;
    name: string;
    color: string;
    avatar_url: string | null;
    points: number;
    overall_points: number;
  }>
): RankedTeam[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.overall_points !== a.overall_points) return b.overall_points - a.overall_points;
    return a.name.localeCompare(b.name);
  });

  let currentRank = 1;
  return sorted.map((team, index) => {
    if (index > 0 && team.points < sorted[index - 1].points) {
      currentRank = index + 1;
    }
    return {
      ...team,
      rank: currentRank,
    };
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const access = await withDbRetry(() => getPublicEventByToken(token));

    if (!access) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          message: 'This event link is invalid or no longer exists. Please check your link and try again.',
        },
        { status: 404 }
      );
    }

    const event = access.event;

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

    const days = event.eventDays.map((day) => ({
      day_number: day.dayNumber,
      label: day.label || `Day ${day.dayNumber}`,
      is_locked: day.isLocked,
      carry_over_from_previous: day.carryOverFromPrevious,
    }));

    // Ensure at least Day 1 exists in the response
    if (days.length === 0) {
      days.push({
        day_number: 1,
        label: 'Day 1',
        is_locked: false,
        carry_over_from_previous: true,
      });
    }

    const teams = event.teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      avatar_url: team.avatarUrl,
      total_points: calculateTeamTotal(team.scores),
    }));

    // Build overall standings
    const overallStandings = rankTeams(
      teams.map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        avatar_url: team.avatar_url,
        points: team.total_points,
        overall_points: team.total_points,
      }))
    );

    // Build per-day standings (for every day in the event)
    const dayStandings: Record<number, RankedTeam[]> = {};
    const allDayNumbers = Array.from(
      new Set([
        ...days.map((d) => d.day_number),
        event.activeDayNumber || 1,
      ])
    ).sort((a, b) => a - b);

    for (const dayNum of allDayNumbers) {
      const dayEntries = event.teams.map((team) => {
        const dayScores = team.scores.filter(
          (score) => (score.eventDay?.dayNumber ?? 1) === dayNum
        );
        const dayPoints = calculateTeamTotal(dayScores);
        const overallPoints = calculateTeamTotal(team.scores);
        return {
          id: team.id,
          name: team.name,
          color: team.color,
          avatar_url: team.avatarUrl,
          points: dayPoints,
          overall_points: overallPoints,
        };
      });
      dayStandings[dayNum] = rankTeams(dayEntries);
    }

    const scores = event.teams
      .flatMap((team) =>
        team.scores.map((score) => ({
          id: score.id,
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          category: score.category || (score.points < 0 ? 'Deduction' : 'Game Score'),
          points: score.points,
          penalty: score.penalty,
          bonus: score.bonus,
          notes: score.notes,
          day_number: score.eventDay?.dayNumber ?? 1,
          day_label: score.eventDay?.label ?? `Day ${score.eventDay?.dayNumber ?? 1}`,
          created_at: score.createdAt.toISOString(),
        }))
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const groupedByDay = new Map<number, typeof scores>();
    for (const score of scores) {
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

    const totalPoints = teams.reduce((sum, team) => sum + (team.total_points || 0), 0);
    const totalScores = scores.length;
    const waiting = event.eventStatus === 'active' && teams.length === 0 && totalScores === 0;

    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          mode: event.eventMode,
          status: event.eventStatus,
          scoringMode: event.scoringMode,
          numberOfDays: event.numberOfDays,
          activeDayNumber: event.activeDayNumber || 1,
          showPublicActivity: event.showPublicActivity,
          startDate: event.startAt.toISOString(),
          endDate: event.endAt.toISOString(),
          isFinalized: event.isFinalized,
          finalizedAt: event.finalizedAt?.toISOString() ?? null,
        },
        teams,
        overall_standings: overallStandings,
        day_standings: dayStandings,
        scores: event.showPublicActivity ? scores : [],
        scores_by_day: event.showPublicActivity ? scoresByDay : [],
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
        message: 'Unable to load scoreboard. Please try again in a moment.',
      },
      { status: 500 }
    );
  }
}

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
