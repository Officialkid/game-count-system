/**
 * Public Event Display API (by Event ID)
 * GET /api/public/by-event/{eventId}
 * 
 * Used by the /display/[eventId] page for public live scoreboards
 * Returns all event data without requiring a token
 * 
 * Responses:
 * - 200: Success with event data (may include empty teams/scores for "waiting" state)
 * - 404: Event not found
 * - 410: Event expired
 * - 500: Server error
 */

import { NextResponse } from 'next/server';
import {
  getEventById,
  listTeamsWithTotals,
  listScores,
  listScoresByDay,
  listEventDays,
} from '@/lib/db-access';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Get event by ID (no token required for public display)
    const event = await getEventById(eventId);

    // Event not found
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

    // Event expired - check if current time is past end_at
    if (event.status === 'expired' || (event.end_at && new Date(event.end_at) < new Date())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event expired',
          message: `This event ended on ${new Date(event.end_at!).toLocaleDateString()} and is no longer available.`,
          expired_at: event.end_at,
        },
        { status: 410 }
      );
    }

    // Get complete event data in parallel
    const [teams, scores, scoresByDay, days] = await Promise.all([
      listTeamsWithTotals(event.id),
      listScores(event.id),
      event.mode === 'camp' ? listScoresByDay(event.id) : Promise.resolve([]),
      event.mode === 'camp' ? listEventDays(event.id) : Promise.resolve([])
    ]);

    // Calculate totals
    const totalPoints = teams.reduce(
      (sum: number, team: { total_points?: number | null }) => sum + (team.total_points ?? 0),
      0
    );
    const totalScores = scores.length;

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
          is_finalized: event.is_finalized || false,
          finalized_at: event.finalized_at,
          has_scores: totalScores > 0,
        },
        teams,
        scores,
        scores_by_day: scoresByDay,
        days,
        totals: {
          teams: teams.length,
          scores: totalScores,
          total_points: totalPoints,
        },
      },
    });
  } catch (error) {
    console.error('Get event by ID error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Unable to load the event. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Block all mutations - read-only endpoint
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed', message: 'This is a read-only endpoint.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed', message: 'This is a read-only endpoint.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed', message: 'This is a read-only endpoint.' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed', message: 'This is a read-only endpoint.' },
    { status: 405 }
  );
}
