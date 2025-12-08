import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getEventStatus, type EventStatus } from '@/lib/dateUtils';

/**
 * GET /api/events/update-statuses
 * 
 * Updates event statuses based on current date
 * Can be called by:
 * - Vercel Cron: `.vercel/crons/update-event-statuses.ts`
 * - Manual API calls (requires authorization token in header)
 * 
 * Returns:
 * - Count of events with status changes
 * - List of events that transitioned status
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authorization - requires either:
    // 1. Vercel cron secret (CRON_SECRET env var)
    // 2. Valid API key header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && request.headers.get('x-vercel-cron-secret') !== cronSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Get all events with date information
      const eventsResult = await client.query(`
        SELECT id, start_date, end_date, status, previous_status
        FROM events
        WHERE start_date IS NOT NULL OR end_date IS NOT NULL
        ORDER BY updated_at DESC
      `);

      const events = eventsResult.rows;
      const transitionedEvents = [];

      // Update each event's status
      for (const event of events) {
        const oldStatus = event.status || 'inactive';
        const newStatus = getEventStatus(event.start_date, event.end_date, true);

        // Only update if status changed
        if (oldStatus !== newStatus) {
          await client.query(
            `
            UPDATE events
            SET status = $1, previous_status = $2, status_updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            `,
            [newStatus, oldStatus, event.id]
          );

          transitionedEvents.push({
            id: event.id,
            oldStatus,
            newStatus,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json(
        {
          success: true,
          message: `Updated statuses for ${events.length} events`,
          transitioned: transitionedEvents.length,
          transitions: transitionedEvents,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating event statuses:', error);
    return NextResponse.json(
      {
        error: 'Failed to update event statuses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/update-statuses
 * 
 * Manual trigger to update a specific event's status
 * Requires authorization token
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get event details
      const eventResult = await client.query(
        `
        SELECT id, start_date, end_date, status, previous_status
        FROM events
        WHERE id = $1
        `,
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      const event = eventResult.rows[0];
      const oldStatus = event.status || 'inactive';
      const newStatus = getEventStatus(event.start_date, event.end_date, true);

      // Update if status changed
      if (oldStatus !== newStatus) {
        await client.query(
          `
          UPDATE events
          SET status = $1, previous_status = $2, status_updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
          `,
          [newStatus, oldStatus, eventId]
        );

        return NextResponse.json(
          {
            success: true,
            eventId,
            oldStatus,
            newStatus,
            transitioned: true,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            success: true,
            eventId,
            status: newStatus,
            transitioned: false,
            message: 'Event status has not changed',
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update event status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
