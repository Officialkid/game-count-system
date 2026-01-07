/**
 * Add Team to Event
 * POST /api/events/{event_id}/teams
 * Requires: X-ADMIN-TOKEN header
 */

import { NextResponse } from 'next/server';
import { addTeam, getEventByToken, getEventById } from '@/lib/db-access';
import { CreateTeamSchema } from '@/lib/db-validations';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';
import { ZodError } from 'zod';

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    
    // Get admin token from header
    const adminToken = request.headers.get('x-admin-token');
    
    if (!adminToken) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-ADMIN-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }
    
    // Verify admin token has access to this event
    const event = await getEventByToken(adminToken, 'admin');
    
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
