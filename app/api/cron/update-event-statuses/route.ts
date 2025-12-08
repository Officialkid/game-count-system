import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Cron Job: Update Event Statuses
 * Runs daily at midnight UTC
 * 
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-event-statuses",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 * 
 * This endpoint calls the status update API to recalculate event statuses
 * based on their start and end dates
 */

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const cronSecret = request.headers.get('x-vercel-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Call the status update endpoint
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events/update-statuses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${expectedSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status update failed: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        message: 'Event statuses updated successfully',
        details: data,
        executedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
