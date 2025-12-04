// app/api/cron/deactivate-expired-events/route.ts
// Cron endpoint to automatically deactivate events past their end date
// Should be called daily via external cron service (e.g., Render Cron Jobs, GitHub Actions)

import { NextRequest, NextResponse } from 'next/server';
import { deactivateExpiredEvents } from '@/lib/event-utils';
import { APIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization header check for cron job security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Run the deactivation process
    const deactivatedCount = await deactivateExpiredEvents();

    console.log(`✅ Deactivated ${deactivatedCount} expired events`);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          deactivated_count: deactivatedCount,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
