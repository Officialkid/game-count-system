import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateStatusTransitionMessage, type StatusTransitionNotification } from '@/lib/notifications';

/**
 * GET /api/events/status-notifications
 * 
 * Retrieves status transition notifications for the authenticated user's events
 * Returns notifications created since the last check
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Get time parameter (optional, default to last 24 hours)
    const url = new URL(request.url);
    const since = url.searchParams.get('since') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const client = await pool.connect();

    try {
      // Get events for the authenticated user
      const eventsResult = await client.query(
        `
        SELECT e.id, e.event_name, e.previous_status, e.status, e.status_updated_at
        FROM events e
        WHERE e.user_id = (SELECT id FROM users WHERE id = auth.user_id())
        AND e.status_updated_at > $1
        AND e.status IS NOT NULL
        AND e.previous_status IS NOT NULL
        AND e.status != e.previous_status
        ORDER BY e.status_updated_at DESC
        `,
        [since]
      );

      const notifications = eventsResult.rows.map((event) => ({
        eventId: event.id,
        eventName: event.event_name,
        previousStatus: event.previous_status,
        newStatus: event.status,
        timestamp: new Date(event.status_updated_at),
        message: generateStatusTransitionMessage(
          event.event_name,
          event.previous_status,
          event.status
        ),
      }));

      return NextResponse.json(
        {
          success: true,
          notifications,
          count: notifications.length,
          retrievedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching status notifications:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
