// app/api/teams/check-name/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();
    const { event_id, team_name } = body;

    if (!event_id || !team_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: event_id and team_name',
        },
        { status: 400 }
      );
    }

    const { user } = authResult;

    // SECURITY: Verify event ownership
    const event = await db.getEventById(event_id);
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - You do not own this event',
        },
        { status: 403 }
      );
    }

    // Check if team name exists (case-insensitive)
    const isDuplicate = await db.isTeamNameDuplicate(event_id, team_name.trim());

    if (isDuplicate) {
      // Generate suggestions
      const suggestions = await db.generateTeamNameSuggestions(event_id, team_name.trim());
      
      return NextResponse.json(
        {
          success: true,
          data: {
            available: false,
            suggestions,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          available: true,
          suggestions: [],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Check team name error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
