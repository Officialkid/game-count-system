// app/api/events/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { createEventSchema } from '@/lib/validations';
import { APIResponse } from '@/lib/types';
import { invalidateUserEventsList } from '@/lib/cache';

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
      console.log('📝 Create event request body:', body);
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
        console.error('❌ Validation failed:', validation.error.errors);
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { 
      event_name, 
      start_date = null,
      end_date = null,
      theme_color = 'purple',
      logo_url = null,
      allow_negative = false,
      display_mode = 'cumulative',
      num_teams = 3
    } = validation.data;

    // Create event with Phase 2 fields
    const event = await db.createEvent(
      user.userId, 
      event_name,
      theme_color,
      logo_url,
      allow_negative,
      display_mode,
      num_teams,
      start_date,
      end_date
    );

    // Create a share link token for the event
    const shareToken = nanoid(16);
    await db.createShareLink(event.id, shareToken);

    // Invalidate user's events list cache
    invalidateUserEventsList(user.userId);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          event: {
            id: event.id,
            user_id: event.user_id,
            event_name: event.event_name,
            created_at: event.created_at,
            start_date: event.start_date,
            end_date: event.end_date,
            theme_color: event.theme_color,
            logo_url: event.logo_url,
            allow_negative: event.allow_negative,
            display_mode: event.display_mode,
            num_teams: event.num_teams,
          },
          share_token: shareToken,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
