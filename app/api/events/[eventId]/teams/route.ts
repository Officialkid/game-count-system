// app/api/events/[eventId]/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { addTeamSchema } from '@/lib/validations';
import { APIResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;
    const eventId = params.eventId;

    // Verify event ownership
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Unauthorized to add teams to this event',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = addTeamSchema.safeParse({ ...body, event_id: eventId });

    if (!validation.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { team_name, avatar_url } = validation.data;

    const team = await db.createTeam(eventId, team_name, avatar_url || null);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: { team },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add team error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to add team',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;

    // Verify event exists
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    const teams = await db.listTeamsByEvent(eventId);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: { teams },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List teams error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to list teams',
      },
      { status: 500 }
    );
  }
}
