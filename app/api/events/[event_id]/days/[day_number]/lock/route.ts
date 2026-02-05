/**
 * Lock/Unlock Day API
 * POST /api/events/[event_id]/days/[day_number]/lock
 */

import { NextResponse } from 'next/server';
import { adminGetDocument, adminUpdateDocument } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS } from '@/lib/firebase-collections';
import { requireAdminToken } from '@/lib/token-middleware';
import { canLockDay, canUnlockDay, isDayLocked } from '@/lib/day-locking';

interface LockDayRequest {
  action: 'lock' | 'unlock';
  token: string;
}

export async function POST(
  request: Request,
  { params }: { params: { event_id: string; day_number: string } }
) {
  try {
    const { event_id, day_number } = params;
    const dayNum = parseInt(day_number, 10);

    if (isNaN(dayNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid day number' },
        { status: 400 }
      );
    }

    const body: LockDayRequest = await request.json();
    const { action, token } = body;

    if (!action || !token) {
      return NextResponse.json(
        { success: false, error: 'Action and token are required' },
        { status: 400 }
      );
    }

    if (action !== 'lock' && action !== 'unlock') {
      return NextResponse.json(
        { success: false, error: 'Action must be "lock" or "unlock"' },
        { status: 400 }
      );
    }

    // Validate admin token
    const validation = await requireAdminToken(event_id, token);
    
    if (validation instanceof NextResponse) {
      return validation;
    }

    const { event } = validation;
    const eventData = event as any;

    // Validate action
    if (action === 'lock') {
      const canLock = canLockDay(eventData, dayNum);
      if (!canLock.allowed) {
        return NextResponse.json(
          { success: false, error: canLock.reason },
          { status: 400 }
        );
      }
    } else {
      const canUnlock = canUnlockDay(eventData, dayNum);
      if (!canUnlock.allowed) {
        return NextResponse.json(
          { success: false, error: canUnlock.reason },
          { status: 400 }
        );
      }
    }

    // Get current locked days
    const currentLockedDays = eventData.lockedDays || [];

    // Update locked days
    let newLockedDays: number[];
    if (action === 'lock') {
      newLockedDays = [...currentLockedDays, dayNum].sort((a, b) => a - b);
    } else {
      newLockedDays = currentLockedDays.filter((d: number) => d !== dayNum);
    }

    // Update event
    await adminUpdateDocument(COLLECTIONS.EVENTS, event_id, {
      lockedDays: newLockedDays,
    });

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        dayNumber: dayNum,
        action,
        lockedDays: newLockedDays,
        message: action === 'lock'
          ? `Day ${dayNum} has been locked`
          : `Day ${dayNum} has been unlocked`,
      },
    });

  } catch (error) {
    console.error('Lock/unlock day error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to lock/unlock day',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET - Check lock status
export async function GET(
  request: Request,
  { params }: { params: { event_id: string; day_number: string } }
) {
  try {
    const { event_id, day_number } = params;
    const dayNum = parseInt(day_number, 10);

    if (isNaN(dayNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid day number' },
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

    const eventData = event as any;
    const isLocked = isDayLocked(eventData, dayNum);
    const lockedDays = eventData.lockedDays || [];

    return NextResponse.json({
      success: true,
      data: {
        eventId: event_id,
        dayNumber: dayNum,
        isLocked,
        lockedDays,
        canLock: canLockDay(eventData, dayNum),
        canUnlock: canUnlockDay(eventData, dayNum),
      },
    });

  } catch (error) {
    console.error('Check lock status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check lock status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
