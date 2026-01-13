/**
 * Add Score API
 * Requires scorer or admin token
 */

import { NextResponse } from 'next/server';
import { addScore, getEventByToken } from '@/lib/db-access';
import { CreateScoreSchema } from '@/lib/db-validations';
import { ZodError } from 'zod';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function POST(request: Request) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }
    
    const body = await request.json();
    const validated = CreateScoreSchema.parse(body);
    
    // Verify token has access to this event (scorer or admin)
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;
    
    if (!event || event.id !== validated.event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or event access denied' },
        { status: 403 }
      );
    }
    
    // Check event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', 'Event is not active'),
        { status: ERROR_STATUS_MAP.BAD_REQUEST }
      );
    }
    
    // Add score
    const score = await addScore(validated);
    
    return NextResponse.json(successResponse(score), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }
    
    // Handle locked day error
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json(
        errorResponse('CONFLICT', error.message),
        { status: ERROR_STATUS_MAP.CONFLICT }
      );
    }
    
    console.error('Add score error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to add score'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
