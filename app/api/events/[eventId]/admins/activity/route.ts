// app/api/events/[eventId]/admins/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireEventPermission } from '@/lib/middleware';
import * as db from '@/lib/db';

/**
 * GET /api/events/[eventId]/admins/activity
 * Get activity log for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  // Check if user has permission to view activity log
  const permissionResult = await requireEventPermission(request, eventId, 'canViewActivityLog');
  if (!permissionResult.authenticated) return permissionResult.error;

  const { newToken } = permissionResult;

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const { logs, total } = await db.getEventActivityLog(eventId, { page, limit });

    const response = NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
