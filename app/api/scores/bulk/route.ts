/**
 * Bulk Score Submission API
 * POST /api/scores/bulk
 * Supports multi-team positive/negative scores, day_number, category, and submission_key idempotency for offline sync.
 */

import { NextResponse } from 'next/server';
import { requireScorerToken } from '@/lib/token-middleware';
import { addBulkScoresForEvent } from '@/lib/server/score-service';
import { sanitizeApiError } from '@/lib/server/prisma';
import { ScoreSourceType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
    const scorerToken =
      request.headers.get('x-scorer-token') ||
      request.headers.get('x-admin-token') ||
      bearerToken;

    if (!scorerToken) {
      return NextResponse.json(
        { success: false, error: 'Missing scorer token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_id, category, items, day_number, submission_key, source_type } = body;

    if (!event_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'event_id and score items are required' },
        { status: 400 }
      );
    }

    const validation = await requireScorerToken(event_id, scorerToken);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const validSources: ScoreSourceType[] = [
      'manual',
      'quick_add',
      'bulk_entry',
      'import',
      'sync',
      'correction',
    ];
    const resolvedSource: ScoreSourceType = validSources.includes(source_type)
      ? source_type
      : 'bulk_entry';

    const scores = await addBulkScoresForEvent({
      eventId: event_id,
      items: items.map((item: any) => ({
        team_id: String(item.team_id),
        points: Math.trunc(Number(item.points)),
        notes: typeof item.notes === 'string' ? item.notes : undefined,
      })),
      category,
      day: day_number !== undefined && day_number !== null ? Number(day_number) : undefined,
      submissionKey:
        typeof submission_key === 'string' && submission_key.trim()
          ? submission_key.trim()
          : undefined,
      sourceType: resolvedSource,
      tokenType:
        validation.tokenType && validation.tokenType !== 'viewer'
          ? validation.tokenType
          : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        count: scores.length,
        scores,
      },
    });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('locked')) {
      return NextResponse.json(
        { success: false, error: msg },
        { status: 409 }
      );
    }
    if (msg.includes('not active')) {
      return NextResponse.json(
        { success: false, error: msg },
        { status: 400 }
      );
    }

    console.error('Bulk score submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: sanitizeApiError(error, 'Failed to submit bulk scores'),
      },
      { status: 500 }
    );
  }
}
