import { NextRequest, NextResponse } from 'next/server';
import { finalizeEvent, unfinalizeEvent } from '@/lib/server/event-lifecycle-service';
import { requireAdminToken } from '@/lib/token-middleware';

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
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'X-ADMIN-TOKEN header required'
          }
        },
        { status: 401 }
      );
    }

    const validation = await requireAdminToken(event_id, admin_token);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const updatedEvent = await finalizeEvent(event_id);

    return NextResponse.json(
      {
        success: true,
        data: {
          event: {
            id: updatedEvent.id,
            name: updatedEvent.name,
            isFinalized: updatedEvent.isFinalized,
            finalizedAt: updatedEvent.finalizedAt?.toISOString() ?? null
          },
          message: 'Event finalized successfully'
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Finalize event error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to finalize event',
          details: error.message
        }
      },
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
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin token required'
          }
        },
        { status: 401 }
      );
    }

    const validation = await requireAdminToken(event_id, admin_token);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const updatedEvent = await unfinalizeEvent(event_id);

    return NextResponse.json(
      {
        success: true,
        data: {
          event: {
            id: updatedEvent.id,
            name: updatedEvent.name,
            isFinalized: updatedEvent.isFinalized
          },
          message: 'Event unfinalized successfully'
        },
        error: null
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[API] Unfinalize event error:', error);
    return NextResponse.json(
      { 
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to unfinalize event',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
}
