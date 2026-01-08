import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-client';
import { getEventByToken } from '@/lib/db-access';

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
    const body = await request.json();
    const { admin_token } = body;

    if (!admin_token) {
      return NextResponse.json(
        { success: false, error: 'Admin token required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const event = await getEventByToken(admin_token, 'admin');
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin token or access denied' },
        { status: 403 }
      );
    }

    // Check if already finalized
    if (event.is_finalized) {
      return NextResponse.json(
        { success: false, error: 'Event already finalized' },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      data: {
        event: result.rows[0],
        message: 'Event finalized successfully'
      }
    });

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
    const admin_token = searchParams.get('admin_token');

    if (!admin_token) {
      return NextResponse.json(
        { success: false, error: 'Admin token required' },
        { status: 401 }
      );
    }

    // Verify admin token
    const event = await getEventByToken(admin_token, 'admin');
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin token or access denied' },
        { status: 403 }
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
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        event: result.rows[0],
        message: 'Event unfinalized - you can now edit scores'
      }
    });

  } catch (error: any) {
    console.error('[API] Unfinalize event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unfinalize event' },
      { status: 500 }
    );
  }
}
