// app/api/events/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';

export async function PATCH(
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
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json<APIResponse>({ success: false, error: 'Event not found' }, { status: 404 });
    }
    if (event.user_id !== user.userId) {
      return NextResponse.json<APIResponse>({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { event_name, theme_color, logo_url, allow_negative, display_mode } = body;
    const updated = await db.updateEvent(eventId, {
      event_name,
      theme_color,
      logo_url,
      allow_negative,
      display_mode,
    });

    return NextResponse.json<APIResponse>({ success: true, data: { event: updated } }, { status: 200 });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json<APIResponse>({ success: false, error: 'Failed to update event' }, { status: 500 });
  }
}
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const eventId = params.eventId;
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

    // Load teams for this event so the Event page can render immediately
    const teams = await db.listTeamsByEvent(eventId);

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        event,
        teams,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to fetch event',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
          error: 'Unauthorized to delete this event',
        },
        { status: 403 }
      );
    }

    // Delete event (cascades to teams, scores, share_links)
    await db.deleteEvent(eventId);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          message: 'Event deleted successfully',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to delete event',
      },
      { status: 500 }
    );
  }
}
