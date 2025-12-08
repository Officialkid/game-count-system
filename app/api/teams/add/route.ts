// app/api/teams/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { requireEventPermission } from '@/lib/middleware';
import { addTeamSchema } from '@/lib/validations';
import { sanitizeString } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
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

    // Check if user has permission to manage teams
    const permissionResult = await requireEventPermission(request, event_id, 'canManageTeams');
    if (!permissionResult.authenticated) return permissionResult.error;
    const { user, role, newToken } = permissionResult;

    // Verify event exists
    const event = await db.db.getEventById(event_id);
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    // Sanitize team name
    const sanitizedName = sanitizeString(team_name);

    // VALIDATION: Check for duplicate team name (case-insensitive)
    const isDuplicate = await db.db.isTeamNameDuplicate(event_id, sanitizedName);
    if (isDuplicate) {
      // Generate helpful suggestions
      const suggestions = await db.db.generateTeamNameSuggestions(event_id, sanitizedName, 3);
      
      return NextResponse.json(
        {
          success: false,
          error: 'A team with this name already exists in this event',
          suggestions,
        },
        { status: 409 }
      );
    }

    // Add team
    const team = await db.db.createTeam(event_id, sanitizedName, avatar_url);

    // Log admin activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    await db.logAdminActivity(
      event_id,
      user.userId,
      role,
      'add_team',
      'team',
      team.id,
      { team_name: sanitizedName, avatar_url },
      ipAddress,
      userAgent
    );

    const response = NextResponse.json(
      {
        success: true,
        data: { team },
      },
      { status: 201 }
    );

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
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
