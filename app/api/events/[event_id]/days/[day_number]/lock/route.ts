/**
 * Lock Event Day
 * POST /api/events/{event_id}/days/{day_number}/lock
 * Requires: X-ADMIN-TOKEN header
 * Prevents further score submissions to this day
 */

import { NextResponse } from 'next/server';
import { 
  getEventByToken, 
  getEventDay,
  lockEventDay,
  createDayIfNotExists 
} from '@/lib/db-access';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function POST(
  request: Request,
  { params }: { params: { event_id: string; day_number: string } }
) {
  try {
    const { event_id, day_number } = params;
    const dayNum = parseInt(day_number, 10);
    
    if (isNaN(dayNum) || dayNum < 1) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid day number'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }
    
    // Get admin token from header
    const adminToken = request.headers.get('x-admin-token');
    
    if (!adminToken) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-ADMIN-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }
    
    // Verify admin token has access to this event
    const event = await getEventByToken(adminToken, 'admin');
    
    if (!event || event.id !== event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }
    
    // Get or create the day
    let day = await getEventDay(event_id, dayNum);
    
    if (!day) {
      // Create day if it doesn't exist
      day = await createDayIfNotExists({
        event_id,
        day_number: dayNum,
        label: null,
      });
    }
    
    // Lock the day
    const lockedDay = await lockEventDay(day.id, true);
    
    return NextResponse.json(
      successResponse({
        id: lockedDay.id,
        event_id: lockedDay.event_id,
        day_number: lockedDay.day_number,
        is_locked: lockedDay.is_locked,
        message: `Day ${dayNum} locked successfully`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Lock day error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to lock day'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
