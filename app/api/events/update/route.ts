// app/api/events/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { updateEventSchema } from '@/lib/validations';
import { APIResponse } from '@/lib/types';
import { z } from 'zod';

const requestSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
}).merge(updateEventSchema);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { event_id, ...updates } = validation.data;

    // Verify event ownership
    const event = await db.getEventById(event_id);
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
          error: 'Unauthorized to update this event',
        },
        { status: 403 }
      );
    }

    // Update event
    const updatedEvent = await db.updateEvent(event_id, updates);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          event: updatedEvent,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to update event',
      },
      { status: 500 }
    );
  }
}
