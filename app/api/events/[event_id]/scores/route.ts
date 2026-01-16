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
  getEventById,
  getOrCreateEventDay,
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
        { status: 403 }
      );
    }

    // Verify scorer token has access to this event
    const event = await getEventByToken(scorerToken, 'scorer');
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or access denied'),
        { status: 403 }
      );
    }

    // Check event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Event is not active'),
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Malformed JSON body'),
        { status: 400 }
      );
    }

    // Defensive: Validate event exists (server-side, not just by token)
    const eventCheck = await getEventById(event_id);
    if (!eventCheck) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Event not found'),
        { status: 404 }
      );
    }

    // Defensive: Validate team belongs to event
    if (!body.team_id) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'team_id is required'),
        { status: 400 }
      );
    }
    let teamRes;
    try {
      teamRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/events/${event_id}/teams/${body.team_id}`);
    } catch (err) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Team lookup failed'),
        { status: 404 }
      );
    }
    if (teamRes.status === 404) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Team not found'),
        { status: 404 }
      );
    }
    if (teamRes.status !== 200) {
      return NextResponse.json(
        errorResponse('CONFLICT', 'Team does not belong to this event'),
        { status: 409 }
      );
    }

    // Defensive: Always resolve event day if day_number provided
    let dayId: string | null = null;
    if (body.day_number) {
      let day;
      try {
        day = await getOrCreateEventDay(event_id, body.day_number);
      } catch (err: any) {
        // Map all table/column missing to 400
        if (err.code === 'TABLE_MISSING' || /table|column.*missing/i.test(err.message)) {
          return NextResponse.json(
            errorResponse('VALIDATION_ERROR', 'event_days table or required column is missing'),
            { status: 400 }
          );
        }
        return NextResponse.json(
          errorResponse('VALIDATION_ERROR', 'Failed to resolve event day'),
          { status: 400 }
        );
      }
      if (day.is_locked) {
        return NextResponse.json(
          errorResponse('CONFLICT', `Day ${body.day_number} is locked`),
          { status: 409 }
        );
      }
      dayId = day.id;
    }

    // Validate input
    let validated;
    try {
      validated = CreateScoreSchema.parse({
        event_id,
        day_id: dayId,
        team_id: body.team_id,
        category: body.category,
        points: body.points,
      });
    } catch (err: any) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid input'),
        { status: 400 }
      );
    }

    // Add score (DB insert guarded)
    let score;
    try {
      score = await addScore(validated);
    } catch (err: any) {
      // Only log DB errors
      if (err?.status === 400 || err?.status === 409 || err?.status === 404) {
        // Map to correct status
        return NextResponse.json(
          errorResponse(err.status === 409 ? 'CONFLICT' : 'VALIDATION_ERROR', err.message),
          { status: err.status }
        );
      }
      // Only log truly unexpected DB errors
      console.error('[SCORES][DB ERROR]', err);
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Failed to record score'),
        { status: 400 }
      );
    }

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
    // Fallback: treat as validation error
    return NextResponse.json(
      errorResponse('VALIDATION_ERROR', 'Failed to record score'),
      { status: 400 }
    );
  }
}
