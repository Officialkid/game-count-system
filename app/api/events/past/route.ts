/**
 * Get Past Events
 * GET /api/events/past
 * Returns all finalized/archived events for the authenticated admin
 */

import { NextResponse } from 'next/server';
import { getPastEventsForAdminToken } from '@/lib/server/event-lifecycle-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminToken = request.headers.get('x-admin-token');
    
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing admin token'
        },
        { status: 401 }
      );
    }

    const events = await getPastEventsForAdminToken(adminToken);

    return NextResponse.json({
      success: true,
      data: {
        events
      }
    });
  } catch (error: any) {
    console.error('Get past events error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get past events',
        details: error.message
      },
      { status: 500 }
    );
  }
}
