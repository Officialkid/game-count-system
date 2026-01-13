/**
 * Add Team API
 * Requires scorer or admin token
 */

import { NextResponse } from 'next/server';
import { addTeam, getEventByToken } from '@/lib/db-access';
import { CreateTeamSchema } from '@/lib/db-validations';
import { ZodError } from 'zod';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function POST(request: Request) {
  try {
    // Get token from header or query
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }
    
    const body = await request.json();
    const validated = CreateTeamSchema.parse(body);
    
    // Verify token has access to this event (scorer or admin)
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;
    
    if (!event || event.id !== validated.event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or event access denied'),
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
    
    // Add team
    const team = await addTeam(validated);
    
    return NextResponse.json(successResponse(team), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }

    console.error('Add team error:', error);

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to add team'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
