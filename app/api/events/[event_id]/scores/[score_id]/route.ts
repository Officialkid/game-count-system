/**
 * Single Score Edit & Delete API
 * PATCH  /api/events/{event_id}/scores/{score_id}
 * DELETE /api/events/{event_id}/scores/{score_id}
 * Allowed for BOTH Admin and Scorer tokens on unlocked days of active events.
 */

import { NextResponse } from 'next/server';
import { requireScorerToken } from '@/lib/token-middleware';
import { deleteScoreForEvent, updateScoreForEvent } from '@/lib/server/score-service';
import { sanitizeApiError } from '@/lib/server/prisma';

function getAccessToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : null;
  return (
    request.headers.get('x-admin-token') ||
    request.headers.get('x-scorer-token') ||
    bearerToken
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { event_id: string; score_id: string } }
) {
  try {
    const { event_id, score_id } = params;
    const validation = await requireScorerToken(event_id, getAccessToken(request));
    if (validation instanceof NextResponse) {
      return validation;
    }

    const eventRecord = validation.event as any;
    if (eventRecord.isFinalized || eventRecord.eventStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit scores on a finalized or inactive event' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const points = Number(body?.points);
    const category = typeof body?.category === 'string' ? body.category.trim() : undefined;

    if (!Number.isFinite(points) || !Number.isInteger(points)) {
      return NextResponse.json(
        { success: false, error: 'Points must be a whole number' },
        { status: 400 }
      );
    }

    const updated = await updateScoreForEvent({
      scoreId: score_id,
      eventId: event_id,
      points,
      category,
      tokenType:
        validation.tokenType && validation.tokenType !== 'viewer'
          ? validation.tokenType
          : undefined,
    });

    return NextResponse.json({
      success: true,
      data: { score: updated },
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('locked')) {
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }
    if (msg.includes('not found')) {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    console.error('Update score error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to update score') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { event_id: string; score_id: string } }
) {
  try {
    const { event_id, score_id } = params;
    const validation = await requireScorerToken(event_id, getAccessToken(request));
    if (validation instanceof NextResponse) {
      return validation;
    }

    const eventRecord = validation.event as any;
    if (eventRecord.isFinalized || eventRecord.eventStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete scores on a finalized or inactive event' },
        { status: 400 }
      );
    }

    const deleted = await deleteScoreForEvent({
      scoreId: score_id,
      eventId: event_id,
    });

    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('locked')) {
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }
    if (msg.includes('not found')) {
      return NextResponse.json({ success: false, error: msg }, { status: 404 });
    }
    console.error('Delete score error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to delete score') },
      { status: 500 }
    );
  }
}
