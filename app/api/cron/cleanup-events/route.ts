/**
 * Event Cleanup Cron Job
 * Automatically deletes Quick Events that have passed their cleanup date
 * 
 * To enable:
 * 1. Deploy to Vercel and add to vercel.json
 * 2. Or use this as a standalone script: node scripts/cleanup-events.js
 */

import { NextResponse } from 'next/server';
import { adminQueryCollection, adminDeleteDocument, adminGetDocument } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS } from '@/lib/firebase-collections';
import { shouldDeleteEvent } from '@/lib/event-lifecycle';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('⚠️  CRON_SECRET not set - cron job is not protected!');
    return true; // Allow in development
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  console.log('🧹 Starting event cleanup job...');

  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const cleanupResults = {
      checked: 0,
      deleted: 0,
      failed: 0,
      events: [] as Array<{
        id: string;
        name: string;
        mode: string;
        deleted: boolean;
        reason?: string;
      }>,
    };

    // Get all events
    const events = await adminQueryCollection(COLLECTIONS.EVENTS, []);
    cleanupResults.checked = events.length;

    console.log(`📋 Found ${events.length} events to check`);

    // Check each event for cleanup eligibility
    for (const event of events) {
      const shouldDelete = shouldDeleteEvent(
        event.eventMode,
        event.eventStatus,
        event.autoCleanupDate,
        new Date()
      );

      if (shouldDelete) {
        try {
          console.log(`🗑️  Deleting event: ${event.name} (${event.id})`);

          // Delete associated data first
          // 1. Delete scores
          const scores = await adminQueryCollection(COLLECTIONS.SCORES, [
            { field: 'event_id', operator: '==', value: event.id },
          ]);
          
          for (const score of scores) {
            await adminDeleteDocument(COLLECTIONS.SCORES, score.id);
          }

          // 2. Delete teams
          const teams = await adminQueryCollection(COLLECTIONS.TEAMS, [
            { field: 'event_id', operator: '==', value: event.id },
          ]);
          
          for (const team of teams) {
            await adminDeleteDocument(COLLECTIONS.TEAMS, team.id);
          }

          // 3. Delete event days (if any)
          const eventDays = await adminQueryCollection(COLLECTIONS.EVENT_DAYS, [
            { field: 'event_id', operator: '==', value: event.id },
          ]);
          
          for (const day of eventDays) {
            await adminDeleteDocument(COLLECTIONS.EVENT_DAYS, day.id);
          }

          // 4. Finally, delete the event
          await adminDeleteDocument(COLLECTIONS.EVENTS, event.id);

          cleanupResults.deleted++;
          cleanupResults.events.push({
            id: event.id,
            name: event.name,
            mode: event.eventMode,
            deleted: true,
          });

          console.log(`✅ Deleted event: ${event.name}`);
        } catch (error) {
          console.error(`❌ Failed to delete event: ${event.name}`, error);
          cleanupResults.failed++;
          cleanupResults.events.push({
            id: event.id,
            name: event.name,
            mode: event.eventMode,
            deleted: false,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    console.log(`
✨ Cleanup completed:
   Checked: ${cleanupResults.checked}
   Deleted: ${cleanupResults.deleted}
   Failed: ${cleanupResults.failed}
    `);

    return NextResponse.json({
      success: true,
      data: cleanupResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// For manual trigger via POST (requires auth)
export async function POST(request: Request) {
  console.log('🔧 Manual cleanup triggered');
  return GET(request);
}
