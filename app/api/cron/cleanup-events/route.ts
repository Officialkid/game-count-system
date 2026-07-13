import { NextResponse } from 'next/server';
import { cleanupExpiredQuickEvents } from '@/lib/server/event-lifecycle-service';

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn('CRON_SECRET not set; allowing cleanup in local development.');
    return true;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

async function runCleanup(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await cleanupExpiredQuickEvents();
    return NextResponse.json({ success: true, data: results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Cleanup job failed:', error);
    return NextResponse.json({ success: false, error: 'Cleanup job failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: Request) { return runCleanup(request); }
export async function POST(request: Request) { return runCleanup(request); }
