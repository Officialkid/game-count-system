import { NextResponse } from 'next/server';
import { requireScorerToken } from '@/lib/token-middleware';
import { addBulkScoresForEvent } from '@/lib/server/score-service';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
    const scorerToken = request.headers.get('x-scorer-token') || bearerToken;

    if (!scorerToken) {
      return NextResponse.json(
        { success: false, error: 'Missing scorer token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_id, category, items, day_number } = body;

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

    const scores = await addBulkScoresForEvent({
      eventId: event_id,
      items,
      category,
      day: day_number,
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
    console.error('Bulk score submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit bulk scores',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
