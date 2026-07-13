import { NextResponse } from 'next/server';
import prisma from '@/lib/server/prisma';
import { getDayLockStatus, setDayLockStatus } from '@/lib/server/event-lifecycle-service';
import { requireAdminToken } from '@/lib/token-middleware';
import { canLockDay, canUnlockDay } from '@/lib/day-locking';

type LifecycleEventShape = {
  scoringMode: 'continuous' | 'daily';
  start_at: string;
  end_at: string;
  eventStatus: 'draft' | 'active' | 'completed' | 'archived';
  is_finalized: boolean;
  lockedDays: number[];
};

function getAdminToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  const url = new URL(request.url);
  return request.headers.get('x-admin-token') || url.searchParams.get('token') || bearerToken;
}

async function loadLifecycleEvent(eventId: string): Promise<LifecycleEventShape | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { eventDays: { orderBy: { dayNumber: 'asc' } } },
  });

  if (!event) return null;

  return {
    scoringMode: event.scoringMode,
    start_at: event.startAt.toISOString(),
    end_at: event.endAt.toISOString(),
    eventStatus: event.eventStatus,
    is_finalized: event.isFinalized,
    lockedDays: event.eventDays.filter((day) => day.isLocked).map((day) => day.dayNumber),
  };
}

export async function POST(request: Request, { params }: { params: { event_id: string; day_number: string } }) {
  try {
    const { event_id, day_number } = params;
    const dayNumber = Number.parseInt(day_number, 10);

    if (Number.isNaN(dayNumber)) {
      return NextResponse.json({ success: false, error: 'Invalid day number' }, { status: 400 });
    }

    const body = await request.json();
    const action = body?.action as 'lock' | 'unlock' | undefined;
    const token = (body?.token as string | undefined) ?? getAdminToken(request);

    if (!action || !token) {
      return NextResponse.json({ success: false, error: 'Action and token are required' }, { status: 400 });
    }

    if (action !== 'lock' && action !== 'unlock') {
      return NextResponse.json({ success: false, error: 'Action must be "lock" or "unlock"' }, { status: 400 });
    }

    const validation = await requireAdminToken(event_id, token);
    if (validation instanceof NextResponse) return validation;

    const event = await loadLifecycleEvent(event_id);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const permission = action === 'lock' ? canLockDay(event as any, dayNumber) : canUnlockDay(event as any, dayNumber);
    if (!permission.allowed) {
      return NextResponse.json({ success: false, error: permission.reason ?? 'Action not allowed' }, { status: 400 });
    }

    await setDayLockStatus(event_id, dayNumber, action);
    const refreshed = await loadLifecycleEvent(event_id);
    const dayState = await getDayLockStatus(event_id, dayNumber);

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        dayNumber,
        action,
        isLocked: dayState?.isLocked ?? action === 'lock',
        lockedDays: refreshed?.lockedDays ?? [],
        message: action === 'lock' ? `Day ${dayNumber} has been locked` : `Day ${dayNumber} has been unlocked`,
      },
    });
  } catch (error) {
    console.error('Lock/unlock day error:', error);
    return NextResponse.json({ success: false, error: 'Failed to lock/unlock day', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { event_id: string; day_number: string } }) {
  try {
    const { event_id, day_number } = params;
    const dayNumber = Number.parseInt(day_number, 10);

    if (Number.isNaN(dayNumber)) {
      return NextResponse.json({ success: false, error: 'Invalid day number' }, { status: 400 });
    }

    const validation = await requireAdminToken(event_id, getAdminToken(request));
    if (validation instanceof NextResponse) return validation;

    const event = await loadLifecycleEvent(event_id);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const dayState = await getDayLockStatus(event_id, dayNumber);

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        dayNumber,
        isLocked: dayState?.isLocked ?? false,
        lockedDays: event.lockedDays,
        canLock: canLockDay(event as any, dayNumber),
        canUnlock: canUnlockDay(event as any, dayNumber),
      },
    });
  } catch (error) {
    console.error('Check lock status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to check lock status', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
