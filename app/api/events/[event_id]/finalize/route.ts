import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-client';
import { getEventByToken } from '@/lib/db-access';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

/**
 * POST /api/events/[event_id]/finalize
 * Marks an event as finalized (admin only)
 * Once finalized, the event shows "Final Results" instead of "Live Scores"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { event_id: string } }
) {
  try {
    const event_id = params.event_id;

    // Require admin token via header
    const admin_token = request.headers.get('x-admin-token');
    if (!admin_token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-ADMIN-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    // Verify admin token
    const event = await getEventByToken(admin_token, 'admin');
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid admin token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }

    // Expired events cannot be finalized
    if (event.status === 'expired') {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Event expired'),
        { status: 410 }
      );
    }

    // Check if already finalized
    if (event.is_finalized) {
      return NextResponse.json(
        errorResponse('CONFLICT', 'Event already finalized'),
        { status: ERROR_STATUS_MAP.CONFLICT }
      );
    }

    // Finalize the event
    const result = await query(
      `UPDATE events 
       SET is_finalized = TRUE, finalized_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, is_finalized, finalized_at`,
      [event_id]
    );

    return NextResponse.json(
      successResponse({ event: result.rows[0], message: 'Event finalized successfully' }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Finalize event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[event_id]/finalize
 * Unfinalize an event (admin only) - allows re-opening for edits
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { event_id: string } }
) {
  try {
    const event_id = params.event_id;
    const { searchParams } = new URL(request.url);
    const admin_token = request.headers.get('x-admin-token') || searchParams.get('admin_token');

    if (!admin_token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Admin token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    // Verify admin token
    const event = await getEventByToken(admin_token, 'admin');
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid admin token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }

    // Unfinalize the event
    const result = await query(
      `UPDATE events 
       SET is_finalized = FALSE, finalized_at = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, is_finalized`,
      [event_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Event not found'),
        { status: ERROR_STATUS_MAP.NOT_FOUND }
      );
    }

    return NextResponse.json(
      successResponse({ event: result.rows[0], message: 'Event unfinalized - you can now edit scores' }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Unfinalize event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unfinalize event' },
      { status: 500 }
    );
  }
}
