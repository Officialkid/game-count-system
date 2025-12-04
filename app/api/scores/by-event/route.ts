// app/api/scores/by-event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { scoresByEventSchema } from '@/lib/validations';
import { APIResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;

    // Get event_id from query parameters
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    // Validate input
    const validation = scoresByEventSchema.safeParse({ event_id });

    if (!validation.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    // Verify event exists and belongs to user
    const event = await db.getEventById(validation.data.event_id);
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
          error: 'Unauthorized - Event does not belong to user',
        },
        { status: 403 }
      );
    }

    // Get all scores for the event
    const scores = await db.getScoresByEvent(validation.data.event_id);

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        scores,
      },
    });
  } catch (error) {
    console.error('Get scores by event error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
