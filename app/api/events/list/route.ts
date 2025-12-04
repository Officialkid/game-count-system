// app/api/events/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { APIResponse } from '@/lib/types';
import { eventsListCache, withCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;
    const cacheKey = `user:${user.userId}`;

    // Use cache for events list
    const eventsWithTokens = await withCache(
      eventsListCache,
      cacheKey,
      async () => {
        // Get all events for the user
        const events = await db.listEventsByUser(user.userId);

        // Get share tokens for each event
        return await Promise.all(
          events.map(async (event) => {
            const shareLink = await db.getShareLinkByEvent(event.id);
            return {
              ...event,
              share_token: shareLink?.token || null,
            };
          })
        );
      },
      30000 // 30 seconds cache
    );

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        events: eventsWithTokens,
      },
    });
  } catch (error) {
    console.error('List events error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
