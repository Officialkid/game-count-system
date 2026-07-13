/**
 * Archive Event API
 * Manually archive an event (requires admin token)
 */

import { NextResponse } from 'next/server';
import { archiveEvent } from '@/lib/server/event-lifecycle-service';
import { requireAdminToken } from '@/lib/token-middleware';
import { canTransitionTo } from '@/lib/event-lifecycle';

interface ArchiveEventRequest {
  token: string;
}

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const body: ArchiveEventRequest = await request.json();
    const { token } = body;

    const validation = await requireAdminToken(event_id, token);

    if (validation instanceof NextResponse) {
      return validation;
    }

    const { event } = validation;
    const currentStatus = (event as any).eventStatus || 'draft';

    const transition = canTransitionTo(
      currentStatus,
      'archived',
      (event as any).eventMode,
      (event as any).isFinalized
    );

    if (!transition.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: transition.reason || 'Cannot archive event',
        },
        { status: 400 }
      );
    }

    const archived = await archiveEvent(event_id);

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        previousStatus: currentStatus,
        newStatus: 'archived',
        archivedAt: archived.archivedAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Archive event error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
