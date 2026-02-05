/**
 * Events API - Update Event Status
 * PUT /api/events/[event_id]/status
 */

import { NextResponse } from 'next/server';
import { adminGetDocument, adminUpdateDocument } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS, EventStatus } from '@/lib/firebase-collections';
import { getAvailableStatusTransitions } from '@/lib/event-mode-helpers';
import { canTransitionTo } from '@/lib/event-lifecycle';

interface UpdateStatusRequest {
  status: EventStatus;
  admin_token: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const body: UpdateStatusRequest = await request.json();
    const { status, admin_token } = body;

    if (!status || !admin_token) {
      return NextResponse.json(
        { success: false, error: 'Status and admin token are required' },
        { status: 400 }
      );
    }

    // Get event
    const event = await adminGetDocument(COLLECTIONS.EVENTS, event_id);
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify admin token
    if ((event as any).admin_token !== admin_token) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin token' },
        { status: 403 }
      );
    }

    // Check if transition is valid
    const currentStatus = (event as any).eventStatus || 'draft';
    const eventMode = (event as any).eventMode || 'quick';
    const isFinalized = (event as any).is_finalized || false;
    
    const transition = canTransitionTo(currentStatus, status, eventMode, isFinalized);
    
    if (!transition.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: transition.reason || `Cannot transition from ${currentStatus} to ${status}`,
          availableTransitions: getAvailableStatusTransitions(currentStatus)
        },
        { status: 400 }
      );
    }

    // Update status
    const updateData: any = {
      eventStatus: status,
    };

    // If moving to completed, also finalize
    if (status === 'completed') {
      updateData.is_finalized = true;
      updateData.finalized_at = new Date().toISOString();
      updateData.status = 'finalized'; // Legacy field
    }

    // If moving to active from draft, update legacy status
    if (status === 'active' && currentStatus === 'draft') {
      updateData.status = 'active';
    }

    await adminUpdateDocument(COLLECTIONS.EVENTS, event_id, updateData);

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        previousStatus: currentStatus,
        newStatus: status,
        availableTransitions: getAvailableStatusTransitions(status),
      },
    });

  } catch (error) {
    console.error('Update event status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update event status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - Get available status transitions
export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;

    // Get event
    const event = await adminGetDocument(COLLECTIONS.EVENTS, event_id);
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const currentStatus = (event as any).eventStatus || 'draft';
    const availableTransitions = getAvailableStatusTransitions(currentStatus);

    return NextResponse.json({
      success: true,
      data: {
        currentStatus,
        availableTransitions,
      },
    });

  } catch (error) {
    console.error('Get status transitions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status transitions',
      },
      { status: 500 }
    );
  }
}
