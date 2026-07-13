import { NextResponse } from 'next/server';
import { getEventStatusInfo, updateEventStatus } from '@/lib/server/event-lifecycle-service';
import { getAvailableStatusTransitions } from '@/lib/event-mode-helpers';
import { canTransitionTo } from '@/lib/event-lifecycle';
import { requireAdminToken } from '@/lib/token-middleware';

type EventStatus = 'draft' | 'active' | 'completed' | 'archived';

interface UpdateStatusRequest {
  status: EventStatus;
  admin_token: string;
}

export async function PUT(request: Request, { params }: { params: { event_id: string } }) {
  try {
    const { event_id } = params;
    const body: UpdateStatusRequest = await request.json();
    const { status, admin_token } = body;

    if (!status || !admin_token) {
      return NextResponse.json({ success: false, error: 'Status and admin token are required' }, { status: 400 });
    }

    const validation = await requireAdminToken(event_id, admin_token);
    if (validation instanceof NextResponse) return validation;

    const currentStatus = (validation.event as any).eventStatus || 'draft';
    const eventMode = (validation.event as any).eventMode || 'quick';
    const isFinalized = (validation.event as any).isFinalized || false;
    const transition = canTransitionTo(currentStatus, status, eventMode, isFinalized);

    if (!transition.allowed) {
      return NextResponse.json({ success: false, error: transition.reason || `Cannot transition from ${currentStatus} to ${status}`, availableTransitions: getAvailableStatusTransitions(currentStatus) }, { status: 400 });
    }

    await updateEventStatus(event_id, status);
    return NextResponse.json({ success: true, data: { eventId: event_id, previousStatus: currentStatus, newStatus: status, availableTransitions: getAvailableStatusTransitions(status) } });
  } catch (error) {
    console.error('Update event status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update event status', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { event_id: string } }) {
  try {
    const event = await getEventStatusInfo(params.event_id);
    if (!event) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: { currentStatus: event.currentStatus, availableTransitions: getAvailableStatusTransitions(event.currentStatus) } });
  } catch (error) {
    console.error('Get status transitions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get status transitions' }, { status: 500 });
  }
}
