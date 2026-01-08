/**
 * Get Event Days API
 * GET /api/events/[event_id]/days
 */

import { NextResponse } from 'next/server';
import { listEventDays } from '@/lib/db-access';
import { successResponse, errorResponse } from '@/lib/api-responses';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;

    const days = await listEventDays(event_id);

    return NextResponse.json(
      successResponse({ days, total: days.length })
    );
  } catch (error: any) {
    console.error('[GET EVENT DAYS] Error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch event days'),
      { status: 500 }
    );
  }
}
