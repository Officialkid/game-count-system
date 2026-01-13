/**
 * Teams API
 * GET /api/events/{event_id}/teams - List teams
 * POST /api/events/{event_id}/teams - Add team
 * Requires: X-ADMIN-TOKEN or X-SCORER-TOKEN header
 */

import { NextResponse } from 'next/server';
import { addTeam, getEventByToken, getEventById, listTeamsWithTotals } from '@/lib/db-access';
import { CreateTeamSchema } from '@/lib/db-validations';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';
import { ZodError } from 'zod';

/**
 * GET - List teams for event
 */
export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    
    // Get token from header (admin or scorer)
    const adminToken = request.headers.get('x-admin-token');
    const scorerToken = request.headers.get('x-scorer-token');
    const publicToken = request.headers.get('x-public-token');
    
    const token = adminToken || scorerToken || publicToken;
    
    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }
    
    // Verify token has access to this event
    const tokenType = adminToken ? 'admin' : scorerToken ? 'scorer' : 'public';
    const event = await getEventByToken(token, tokenType);
    
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }
    
    // Get teams
    const teams = await listTeamsWithTotals(event_id);
    
    return NextResponse.json(
      successResponse({ teams }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get teams error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to get teams'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}

/**
 * POST - Add team to event
 */

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    
    // Allow admin or scorer to create teams (scorer-only role limited to team creation and scoring)
    const adminToken = request.headers.get('x-admin-token');
    const scorerToken = request.headers.get('x-scorer-token');

    if (!adminToken && !scorerToken) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-ADMIN-TOKEN or X-SCORER-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    // Verify token has access to this event (prefer admin)
    const event = adminToken
      ? await getEventByToken(adminToken, 'admin')
      : await getEventByToken(scorerToken!, 'scorer');
    
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }
    
    // Check event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', 'Event is not active'),
        { status: ERROR_STATUS_MAP.BAD_REQUEST }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validated = CreateTeamSchema.parse({
      event_id,
      ...body,
    });
    
    // Add team
    const team = await addTeam(validated);
    
    return NextResponse.json(
      successResponse({
        id: team.id,
        name: team.name,
        color: team.color,
        avatar_url: team.avatar_url,
        created_at: team.created_at,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }
    
    // Handle duplicate team name
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        errorResponse('CONFLICT', error.message),
        { status: ERROR_STATUS_MAP.CONFLICT }
      );
    }
    
    console.error('Add team error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to add team'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
