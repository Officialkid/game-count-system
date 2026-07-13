/**
 * Submit Score
 * POST /api/events/{event_id}/scores
 * Requires: X-SCORER-TOKEN header
 * Auto-creates event_day if missing
 * Rejects if day is locked
 */

import { NextResponse } from 'next/server';
import { addScoreForEvent, ensureEventDay, getEventDayInfo } from '@/lib/server/score-service';
import { requireScorerToken } from '@/lib/token-middleware';
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
    
    const validation = await requireScorerToken(event_id, scorerToken);
    if (validation instanceof NextResponse) {
      return validation;
    }
    
    // Check event is active
    if ((validation.event as any).eventStatus !== 'active') {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', 'Event is not active'),
        { status: ERROR_STATUS_MAP.BAD_REQUEST }
      );
    }
    
    const body = await request.json();
    
    // Auto-create event day if day_number provided
    let dayInfo: any = null;
    if (body.day_number) {
      await ensureEventDay(event_id, body.day_number);
      dayInfo = await getEventDayInfo(event_id, body.day_number);
      
      // Check if day is locked
      if (dayInfo?.isLocked) {
        return NextResponse.json(
          errorResponse('CONFLICT', `Day ${body.day_number} is locked`),
          { status: ERROR_STATUS_MAP.CONFLICT }
        );
      }
    }
    
    // Validate input - CreateScoreSchema expects teamId, points, day
    const validated = CreateScoreSchema.parse({
      teamId: body.team_id,
      points: body.points,
      day: body.day_number || 1,
      penalty: body.penalty,
      bonus: body.bonus,
      notes: body.notes,
    });
    
    const score = await addScoreForEvent({
      eventId: event_id,
      teamId: validated.teamId,
      day: validated.day,
      points: validated.points,
      penalty: validated.penalty,
      bonus: validated.bonus,
      notes: validated.notes,
      tokenType:
        validation.tokenType && validation.tokenType !== 'viewer'
          ? validation.tokenType
          : undefined,
    });
    
    return NextResponse.json(
      successResponse({
        id: score.id,
        eventId: score.eventId,
        teamId: score.teamId,
        day: score.day,
        points: score.points,
        penalty: score.penalty,
        bonus: score.bonus,
        created_at: score.created_at,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input'),
        { status: ERROR_STATUS_MAP.UNPROCESSABLE_ENTITY }
      );
    }
    
    // Handle locked day error
    if (error instanceof Error) {
      const msg = error.message || '';
      const anyErr = error as any;

      // Locked day
      if (msg.includes('locked')) {
        return NextResponse.json(
          errorResponse('BAD_REQUEST', msg),
          { status: ERROR_STATUS_MAP.BAD_REQUEST }
        );
      }

      // Team validation errors thrown from service layer
      if (msg.toLowerCase().includes('team')) {
        return NextResponse.json(
          errorResponse('BAD_REQUEST', msg),
          { status: ERROR_STATUS_MAP.BAD_REQUEST }
        );
      }

      // Map common Postgres FK error code
      if (anyErr.code === '23503') {
        return NextResponse.json(
          errorResponse('BAD_REQUEST', 'Invalid team or day reference'),
          { status: ERROR_STATUS_MAP.BAD_REQUEST }
        );
      }
    }

    console.error('Add score error:', error);

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to add score'),
      { status: ERROR_STATUS_MAP.INTERNAL_SERVER_ERROR }
    );
  }
}
