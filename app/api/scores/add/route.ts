import { NextResponse } from 'next/server';
import { addScoreForEvent, getEventDayInfo } from '@/lib/server/score-service';
import prisma from '@/lib/server/prisma';

interface AddScoreRequest {
  event_id: string;
  team_id: string;
  points: number;
  day?: number;
  penalty?: number;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body: AddScoreRequest = await request.json();
    const { event_id, team_id, points, day, penalty = 0, notes } = body;

    // Validation
    if (!event_id || !team_id) {
      return NextResponse.json(
        { success: false, error: 'Event ID and Team ID are required' },
        { status: 400 }
      );
    }

    if (points === undefined || points === null) {
      return NextResponse.json(
        { success: false, error: 'Points are required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: event_id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const team = await prisma.team.findFirst({
      where: {
        id: team_id,
        eventId: event_id,
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found for this event' },
        { status: 400 }
      );
    }

    if (event.isFinalized) {
      return NextResponse.json(
        { success: false, error: 'Cannot add scores to a finalized event' },
        { status: 403 }
      );
    }

    if (event.scoringMode === 'daily' && day) {
      if (day < 1 || day > event.numberOfDays) {
        return NextResponse.json(
          { success: false, error: 'Invalid day number' },
          { status: 400 }
        );
      }

      const eventDay = await getEventDayInfo(event_id, day);
      if (eventDay?.isLocked) {
        return NextResponse.json(
          { success: false, error: 'This day is locked and cannot accept new scores' },
          { status: 403 }
        );
      }
    }

    const score = await addScoreForEvent({
      eventId: event_id,
      teamId: team_id,
      day: day ?? 1,
      points,
      penalty,
      notes,
      category: 'Score',
    });

    return NextResponse.json({
      success: true,
      data: {
        score,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Add score error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
