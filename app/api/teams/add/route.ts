import { NextResponse } from 'next/server';
import prisma from '@/lib/server/prisma';
import { createTeamsForEvent } from '@/lib/server/team-service';

interface AddTeamRequest {
  event_id: string;
  name: string;
  color?: string;
}

export async function POST(request: Request) {
  try {
    const body: AddTeamRequest = await request.json();
    const { event_id, name, color = '#3B82F6' } = body;

    if (!event_id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Event ID and team name are required' },
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

    const existingTeam = await prisma.team.findFirst({
      where: {
        eventId: event_id,
        name: name.trim(),
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { success: false, error: 'A team with this name already exists in this event' },
        { status: 409 }
      );
    }

    const [team] = await createTeamsForEvent(event_id, [{ name: name.trim(), color }]);

    return NextResponse.json({
      success: true,
      data: {
        team,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Add team error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
