/**
 * TV Remote Pairing API
 * POST /api/tv-remote/pair
 * Connects a phone remote to a live TV/projector screen using the 4-digit code shown on the TV.
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
        { success: false, error: 'Please enter the 4-digit TV code shown on the screen.' },
        { status: 400 }
      );
    }

    // Search active events for matching tvRemoteState.pairCode
    const activeEvents = await withDbRetry(() =>
      prisma.event.findMany({
        where: { eventStatus: { in: ['active', 'completed'] } },
        include: {
          teams: { select: { id: true } },
          tokens: { where: { tokenType: 'viewer' }, select: { plainToken: true } },
        },
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
        {
          success: false,
          error: `No active TV screen found for code ${rawCode}. Make sure the scoreboard is open on your laptop/TV.`,
        },
        { status: 404 }
      );
    }

    const prevState = (matched.tvRemoteState as any) || {};
    const updatedState = {
      mode: prevState.mode || 'scoreboard',
      slideIndex: prevState.slideIndex ?? 0,
      revealNowNonce: prevState.revealNowNonce ?? 0,
      confettiNonce: prevState.confettiNonce ?? 0,
      theme: prevState.theme || 'dark',
      pairCode: rawCode,
      pairedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await withDbRetry(() =>
      prisma.event.update({
        where: { id: matched.id },
        data: { tvRemoteState: updatedState as any },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        event_id: matched.id,
        event_name: matched.name,
        public_token: matched.tokens[0]?.plainToken || null,
        team_count: matched.teams.length,
        is_frozen: matched.isFrozen,
        pair_code: rawCode,
        tv_remote: updatedState,
      },
    });
  } catch (error) {
    console.error('TV pair error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to pair with TV') },
      { status: 500 }
    );
  }
}
