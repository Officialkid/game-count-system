/**
 * Archive Event API
 * Manually archive an event (requires admin token)
 */

import { NextResponse } from 'next/server';
import { adminGetDocument, adminUpdateDocument } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS, EventStatus } from '@/lib/firebase-collections';
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

    // Validate admin token
    const validation = await requireAdminToken(event_id, token);
    
    if (validation instanceof NextResponse) {
      return validation;
    }

    const { event } = validation;
    const currentStatus = (event as any).eventStatus || 'draft';

    // Check if transition is allowed
    const transition = canTransitionTo(
      currentStatus,
      'archived',
      (event as any).eventMode,
      (event as any).is_finalized
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

    // Update event status to archived
    await adminUpdateDocument(COLLECTIONS.EVENTS, event_id, {
      eventStatus: 'archived',
      status: 'expired', // Legacy field
      archived_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        previousStatus: currentStatus,
        newStatus: 'archived',
        archivedAt: new Date().toISOString(),
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
