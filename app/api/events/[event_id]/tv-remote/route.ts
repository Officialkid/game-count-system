/**
 * TV Remote Control API
 * POST /api/events/{event_id}/tv-remote
 * Requires: X-ADMIN-TOKEN header
 * Controls any connected TV/Projector display (?tv=1) remotely from the Admin's phone!
 */

import { NextResponse } from 'next/server';
import prisma, { sanitizeApiError, withDbRetry } from '@/lib/server/prisma';
import { requireAdminToken } from '@/lib/token-middleware';

export interface TvRemoteState {
  mode: 'scoreboard' | 'reveal';
  slideIndex: number;
  revealNowNonce: number;
  confettiNonce: number;
  theme: 'dark' | 'light';
  updatedAt: string;
}

const DEFAULT_TV_STATE: TvRemoteState = {
  mode: 'scoreboard',
  slideIndex: 0,
  revealNowNonce: 0,
  confettiNonce: 0,
  theme: 'dark',
  updatedAt: new Date(0).toISOString(),
};

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
    const existingEvent = await withDbRetry(() =>
      prisma.event.findUnique({
        where: { id: event_id },
        select: { tvRemoteState: true, isFrozen: true },
      })
    );

    const prev: TvRemoteState = {
      ...DEFAULT_TV_STATE,
      ...((existingEvent?.tvRemoteState as Partial<TvRemoteState>) || {}),
    };

    const next = {
      ...prev,
      mode: body.mode === 'reveal' || body.mode === 'scoreboard' ? body.mode : prev.mode,
      slideIndex:
        typeof body.slideIndex === 'number' && Number.isInteger(body.slideIndex)
          ? Math.max(0, Math.min(10, body.slideIndex))
          : prev.slideIndex,
      revealNowNonce: body.revealNow ? prev.revealNowNonce + 1 : prev.revealNowNonce,
      confettiNonce: body.fireConfetti ? prev.confettiNonce + 1 : prev.confettiNonce,
      theme: body.theme === 'light' || body.theme === 'dark' ? body.theme : prev.theme,
      pairedAt: (prev as any).pairedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If Admin explicitly switches to Champion slide (index 4) or Podium (index 5), auto-unfreeze!
    const shouldAutoUnfreeze =
      body.autoUnfreeze === true ||
      (next.mode === 'reveal' && next.slideIndex >= 4);

    await withDbRetry(() =>
      prisma.event.update({
        where: { id: event_id },
        data: {
          tvRemoteState: next as any,
          ...(shouldAutoUnfreeze
            ? {
                isFrozen: false,
                frozenAt: null,
                lastUnfrozenAt: new Date(),
              }
            : {}),
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        tv_remote: next,
        unfroze: shouldAutoUnfreeze,
      },
    });
  } catch (error) {
    console.error('TV Remote API error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to send TV remote command') },
      { status: 500 }
    );
  }
}
