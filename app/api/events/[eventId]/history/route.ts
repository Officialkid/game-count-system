// app/api/events/[eventId]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const teamId = searchParams.get('team_id') || undefined;
    const gameNumber = searchParams.get('game_number') ? parseInt(searchParams.get('game_number')!) : undefined;

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

    const history = await db.getGameHistory(eventId, {
      page,
      limit,
      teamId,
      gameNumber,
    });

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          history: history.scores,
          pagination: {
            page: history.page,
            limit: history.limit,
            total: history.total,
            totalPages: Math.ceil(history.total / history.limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to get game history',
      },
      { status: 500 }
    );
  }
}
