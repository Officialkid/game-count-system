// app/api/teams/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { addTeamSchema } from '@/lib/validations';
import { sanitizeString } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const body = await request.json();

    // Validate input
    const validation = addTeamSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { event_id, team_name, avatar_url } = validation.data;
    const { user } = authResult;

    // SECURITY: Verify event ownership before adding team
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

    // Sanitize team name
    const sanitizedName = sanitizeString(team_name);

    // Add team
    const team = await db.createTeam(event_id, sanitizedName, avatar_url);

    return NextResponse.json(
      {
        success: true,
        data: { team },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add team error:', error);
    
    // SECURITY: Check for PostgreSQL unique constraint violation (error code 23505)
    // This is more reliable than string matching
    if (error.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          error: 'A team with this name already exists in this event',
        },
        { status: 409 }
      );
    }

    // Fallback to message checking for other database drivers
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A team with this name already exists in this event',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
