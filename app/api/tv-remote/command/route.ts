/**
 * TV Remote Command API (Code-Authenticated)
 * POST /api/tv-remote/command
 * Sends instant remote / voice commands from a paired phone to the TV/projector screen over Wi-Fi/4G.
 */

import { NextResponse } from 'next/server';
import prisma, { sanitizeApiError, withDbRetry } from '@/lib/server/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawCode = String(body?.code || '')
      .replace(/[^0-9]/g, '')
      .trim();

    if (rawCode.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Valid 4-digit TV code is required' },
        { status: 400 }
      );
    }

    const activeEvents = await withDbRetry(() =>
      prisma.event.findMany({
        where: { eventStatus: { in: ['active', 'completed'] } },
        select: { id: true, tvRemoteState: true, isFrozen: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      })
    );

    const matched = activeEvents.find((ev) => {
      const state = ev.tvRemoteState as any;
      return state && String(state.pairCode || '') === rawCode;
    });

    if (!matched) {
      return NextResponse.json(
        { success: false, error: 'TV session expired or code changed. Re-enter the code on the TV.' },
        { status: 404 }
      );
    }

    const prev = (matched.tvRemoteState as any) || {};
    const next = {
      pairCode: rawCode,
      pairedAt: prev.pairedAt || new Date().toISOString(),
      mode: body.mode === 'reveal' || body.mode === 'scoreboard' ? body.mode : prev.mode || 'scoreboard',
      slideIndex:
        typeof body.slideIndex === 'number' && Number.isInteger(body.slideIndex)
          ? Math.max(0, Math.min(10, body.slideIndex))
          : prev.slideIndex ?? 0,
      revealNowNonce: body.revealNow ? (prev.revealNowNonce ?? 0) + 1 : prev.revealNowNonce ?? 0,
      confettiNonce: body.fireConfetti ? (prev.confettiNonce ?? 0) + 1 : prev.confettiNonce ?? 0,
      theme: body.theme === 'light' || body.theme === 'dark' ? body.theme : prev.theme || 'dark',
      updatedAt: new Date().toISOString(),
    };

    const shouldAutoUnfreeze =
      body.autoUnfreeze === true ||
      (next.mode === 'reveal' && next.slideIndex >= 4);

    const freezeOverride =
      body.freezeAction === 'freeze'
        ? { isFrozen: true, frozenAt: new Date() }
        : body.freezeAction === 'unfreeze' || shouldAutoUnfreeze
        ? { isFrozen: false, frozenAt: null, lastUnfrozenAt: new Date() }
        : {};

    const updated = await withDbRetry(() =>
      prisma.event.update({
        where: { id: matched.id },
        data: {
          tvRemoteState: next as any,
          ...freezeOverride,
        },
        select: { isFrozen: true },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        tv_remote: next,
        is_frozen: updated.isFrozen,
      },
    });
  } catch (error) {
    console.error('TV remote command error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to send command to TV') },
      { status: 500 }
    );
  }
}
