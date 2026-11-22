/**
 * Advance / Switch Event Day API
 * POST /api/events/{event_id}/days/advance
 * Allows Admin to publish/lock the previous day and move to Day N+1 with
 * explicit choice: carry_over_from_previous (continue totals vs start fresh).
 */

import { NextResponse } from 'next/server';
import { requireAdminToken } from '@/lib/token-middleware';
import { advanceEventDay, createAuditLog } from '@/lib/server/event-service';
import { sanitizeApiError } from '@/lib/server/prisma';

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const adminToken =
      request.headers.get('x-admin-token') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      null;

    const validation = await requireAdminToken(event_id, adminToken);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const body = await request.json();
    const targetDayNumber = Number(body.target_day_number);
    const carryOverFromPrevious =
      body.carry_over_from_previous !== undefined
        ? Boolean(body.carry_over_from_previous)
        : true;
    const lockPreviousDay = Boolean(body.lock_previous_day);
    const label = typeof body.label === 'string' ? body.label.trim() : undefined;

    if (!Number.isInteger(targetDayNumber) || targetDayNumber < 1 || targetDayNumber > 30) {
      return NextResponse.json(
        { success: false, error: 'target_day_number must be an integer between 1 and 30' },
        { status: 400 }
      );
    }

    const result = await advanceEventDay({
      eventId: event_id,
      targetDayNumber,
      carryOverFromPrevious,
      lockPreviousDay,
      label,
    });

    await createAuditLog({
      eventId: event_id,
      action: 'update',
      entityType: 'event_day',
      entityId: result.targetDay.id,
      actorTokenType: 'admin',
      payload: {
        activeDayNumber: targetDayNumber,
        carryOverFromPrevious,
        lockPreviousDay,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        active_day_number: result.event.activeDayNumber,
        number_of_days: result.event.numberOfDays,
        scoring_mode: result.event.scoringMode,
        days: result.event.eventDays.map((d) => ({
          id: d.id,
          day_number: d.dayNumber,
          label: d.label || `Day ${d.dayNumber}`,
          is_locked: d.isLocked,
          locked_at: d.lockedAt ? d.lockedAt.toISOString() : null,
          carry_over_from_previous: d.carryOverFromPrevious,
        })),
      },
    });
  } catch (error) {
    console.error('Advance event day error:', error);
    return NextResponse.json(
      {
        success: false,
        error: sanitizeApiError(error, 'Failed to switch event day'),
      },
      { status: 500 }
    );
  }
}
