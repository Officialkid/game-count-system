/**
 * Submit Score
 * POST /api/events/{event_id}/scores
 * Requires: X-SCORER-TOKEN header
 * Auto-creates event_day if missing
 * Rejects if day is locked
 */

import { NextResponse } from 'next/server';
import { 
  addScore, 
  getEventByToken, 
  createDayIfNotExists,
  getEventDay 
} from '@/lib/db-access';
import { CreateScoreSchema } from '@/lib/db-validations';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';
import { ZodError } from 'zod';

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    
    // Get scorer token from header
    const scorerToken = request.headers.get('x-scorer-token');
    
    if (!scorerToken) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-SCORER-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }
    
    // Verify scorer token has access to this event
    const event = await getEventByToken(scorerToken, 'scorer');
    
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
    
    // Auto-create event day if day_number provided
    let dayId: string | null = null;
    if (body.day_number) {
      const day = await createDayIfNotExists({
        event_id,
        day_number: body.day_number,
        label: body.day_label || null,
      });
      
      // Check if day is locked
      if (day.is_locked) {
        return NextResponse.json(
          errorResponse('BAD_REQUEST', `Day ${body.day_number} is locked`),
          { status: ERROR_STATUS_MAP.BAD_REQUEST }
        );
      }
      
      dayId = day.id;
    }
    
    // Validate input
    const validated = CreateScoreSchema.parse({
      event_id,
      day_id: dayId,
      team_id: body.team_id,
      category: body.category,
      points: body.points,
    });
    
    // Validate points >= 0
    if (validated.points < 0) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Points must be >= 0'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }
    
    // Add score
    const score = await addScore(validated);
    
    return NextResponse.json(
      successResponse({
        id: score.id,
        event_id: score.event_id,
        day_id: score.day_id,
        team_id: score.team_id,
        category: score.category,
        points: score.points,
        created_at: score.created_at,
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
    
    // Handle locked day error
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', error.message),
        { status: ERROR_STATUS_MAP.BAD_REQUEST }
      );
    }
    
    console.error('Add score error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to add score'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
