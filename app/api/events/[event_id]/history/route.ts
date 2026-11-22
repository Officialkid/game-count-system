/**
 * Score History API
 * GET /api/events/{event_id}/history
 * Allows BOTH Admin and Scorer tokens to read score history!
 */

import { NextResponse } from 'next/server';
import { requireScorerToken } from '@/lib/token-middleware';
import { getScoreHistoryForEvent } from '@/lib/server/score-service';
import { sanitizeApiError } from '@/lib/server/prisma';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
    const token =
      request.headers.get('x-admin-token') ||
      request.headers.get('x-scorer-token') ||
      bearerToken;

    // requireScorerToken accepts BOTH admin and scorer tokens
    const validation = await requireScorerToken(params.event_id, token);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const scores = await getScoreHistoryForEvent(params.event_id);

    return NextResponse.json({
      success: true,
      data: {
        scores,
        role: validation.tokenType,
      },
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load history',
        details: sanitizeApiError(error),
      },
      { status: 500 }
    );
  }
}
