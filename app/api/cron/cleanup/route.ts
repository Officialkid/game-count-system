/**
 * Cleanup Cron Job
 * Deletes expired events based on retention policy
 * 
 * Schedule: Daily at 2:00 AM UTC (configured in vercel.json)
 * Endpoint: /api/cron/cleanup
 */

import { NextResponse } from 'next/server';
import { cleanupExpiredEvents, markExpiredEvents } from '@/lib/db-access';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      errorResponse('UNAUTHORIZED', 'Invalid cron secret'),
      { status: ERROR_STATUS_MAP.UNAUTHORIZED }
    );
  }
  
  try {
    const startTime = Date.now();
    
    // Mark events as expired (status change only)
    const markedCount = await markExpiredEvents();
    
    // Delete events that should be auto-deleted
    const deletedCount = await cleanupExpiredEvents();
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json(
      successResponse({
        marked_expired: markedCount,
        deleted: deletedCount,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Cleanup cron error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
