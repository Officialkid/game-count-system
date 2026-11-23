/**
 * Suspense Freeze API
 * POST /api/events/{event_id}/freeze
 * Requires: X-ADMIN-TOKEN header
 * Actions:
 * - 'freeze'    : Immediately freezes public scoreboard at current timestamp
 * - 'unfreeze'  : Immediately unfreezes public scoreboard (also called automatically by Reveal Show!)
 * - 'configure' : Updates daily auto_freeze_time ("HH:mm" or null), freeze_mode ("cutoff" | "mystery"), timezone_offset
 */

import { NextResponse } from 'next/server';
import prisma, { sanitizeApiError, withDbRetry } from '@/lib/server/prisma';
import { requireAdminToken } from '@/lib/token-middleware';
import { evaluateEventFreeze } from '@/lib/server/freeze-logic';

function getAdminToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : null;
  return request.headers.get('x-admin-token') || bearerToken;
}

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const validation = await requireAdminToken(event_id, getAdminToken(request));
    if (validation instanceof NextResponse) {
      return validation;
    }

    const body = await request.json();
    const action = body?.action as 'freeze' | 'unfreeze' | 'configure';
    const now = new Date();

    const updateData: Record<string, any> = {};

    if (action === 'freeze') {
      updateData.isFrozen = true;
      updateData.frozenAt = now;
    } else if (action === 'unfreeze') {
      updateData.isFrozen = false;
      updateData.frozenAt = null;
      updateData.lastUnfrozenAt = now;
    } else if (action === 'configure') {
      if (body.auto_freeze_time === null || body.auto_freeze_time === '') {
        updateData.autoFreezeTime = null;
      } else if (
        typeof body.auto_freeze_time === 'string' &&
        /^\d{2}:\d{2}$/.test(body.auto_freeze_time)
      ) {
        updateData.autoFreezeTime = body.auto_freeze_time;
      }

      if (body.freeze_mode === 'cutoff' || body.freeze_mode === 'mystery') {
        updateData.freezeMode = body.freeze_mode;
      }

      if (
        typeof body.timezone_offset === 'number' &&
        Number.isFinite(body.timezone_offset)
      ) {
        updateData.freezeTimezoneOffset = Math.trunc(body.timezone_offset);
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'action must be "freeze", "unfreeze", or "configure"' },
        { status: 400 }
      );
    }

    if (body.freeze_mode === 'cutoff' || body.freeze_mode === 'mystery') {
      updateData.freezeMode = body.freeze_mode;
    }

    const updated = await withDbRetry(() =>
      prisma.event.update({
        where: { id: event_id },
        data: updateData,
      })
    );

    const evaluated = evaluateEventFreeze(updated, now);

    return NextResponse.json({
      success: true,
      data: {
        is_frozen: evaluated.active,
        freeze_reason: evaluated.reason,
        freeze_mode: evaluated.mode,
        frozen_at: evaluated.frozenAt ? evaluated.frozenAt.toISOString() : null,
        auto_freeze_time: updated.autoFreezeTime,
        last_unfrozen_at: updated.lastUnfrozenAt
          ? updated.lastUnfrozenAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error('Freeze API error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to update freeze state') },
      { status: 500 }
    );
  }
}
