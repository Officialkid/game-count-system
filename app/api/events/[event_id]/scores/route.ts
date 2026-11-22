/**
 * Submit Score (Single Entry)
 * POST /api/events/{event_id}/scores
 * Requires: X-SCORER-TOKEN or X-ADMIN-TOKEN header
 * Supports positive awards, negative deductions, category (game/reason), and submission_key idempotency.
 */

import { NextResponse } from 'next/server';
import { addScoreForEvent, ensureEventDay, getEventDayInfo } from '@/lib/server/score-service';
import { requireScorerToken } from '@/lib/token-middleware';
import { sanitizeApiError } from '@/lib/server/prisma';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';
import { ScoreSourceType } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;

    const token =
      request.headers.get('x-scorer-token') ||
      request.headers.get('x-admin-token');

    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-SCORER-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    const validation = await requireScorerToken(event_id, token);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const eventRecord = validation.event as any;
    if (eventRecord.eventStatus !== 'active' || eventRecord.isFinalized) {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', 'Event is not active for scoring'),
        { status: ERROR_STATUS_MAP.BAD_REQUEST }
      );
    }

    const body = await request.json();
    const teamId = String(body.team_id || body.teamId || '').trim();
    const points = Number(body.points);
    const dayNumber =
      body.day_number !== undefined && body.day_number !== null
        ? Number(body.day_number)
        : Number(eventRecord.activeDayNumber || 1);

    if (!teamId) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'team_id is required'),
        { status: ERROR_STATUS_MAP.UNPROCESSABLE_ENTITY }
      );
    }

    if (!Number.isFinite(points) || !Number.isInteger(points)) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Points must be a whole number (positive or negative)'),
        { status: ERROR_STATUS_MAP.UNPROCESSABLE_ENTITY }
      );
    }

    if (dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid day number'),
        { status: ERROR_STATUS_MAP.UNPROCESSABLE_ENTITY }
      );
    }

    await ensureEventDay(event_id, dayNumber);
    const dayInfo = await getEventDayInfo(event_id, dayNumber);
    if (dayInfo?.isLocked) {
      return NextResponse.json(
        errorResponse('CONFLICT', `Day ${dayNumber} is locked`),
        { status: ERROR_STATUS_MAP.CONFLICT }
      );
    }

    const validSources: ScoreSourceType[] = [
      'manual',
      'quick_add',
      'bulk_entry',
      'import',
      'sync',
      'correction',
    ];
    const sourceType: ScoreSourceType = validSources.includes(body.source_type)
      ? body.source_type
      : 'manual';

    const score = await addScoreForEvent({
      eventId: event_id,
      teamId,
      day: dayNumber,
      points,
      penalty: typeof body.penalty === 'number' ? body.penalty : undefined,
      bonus: typeof body.bonus === 'number' ? body.bonus : undefined,
      category:
        typeof body.category === 'string' && body.category.trim()
          ? body.category.trim()
          : typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim()
          : points < 0
          ? 'Deduction'
          : 'Game Score',
      notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
      submissionKey:
        typeof body.submission_key === 'string' && body.submission_key.trim()
          ? body.submission_key.trim()
          : undefined,
      sourceType,
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
        category: score.category,
        penalty: score.penalty,
        bonus: score.bonus,
        deduplicated: score.deduplicated,
        created_at: score.created_at,
      }),
      { status: score.deduplicated ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message || '';
      if (msg.includes('locked')) {
        return NextResponse.json(
          errorResponse('CONFLICT', msg),
          { status: ERROR_STATUS_MAP.CONFLICT }
        );
      }
      if (msg.toLowerCase().includes('team') || msg.toLowerCase().includes('not active')) {
        return NextResponse.json(
          errorResponse('BAD_REQUEST', msg),
          { status: ERROR_STATUS_MAP.BAD_REQUEST }
        );
      }
    }

    console.error('Add score error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', sanitizeApiError(error, 'Failed to add score')),
      { status: ERROR_STATUS_MAP.INTERNAL_SERVER_ERROR }
    );
  }
}
