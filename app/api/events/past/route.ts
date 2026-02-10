/**
 * Get Past Events
 * GET /api/events/past
 * Returns all finalized/archived events for the authenticated admin
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { hashToken } from '@/lib/token-utils';

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

    // Hash the admin token to match stored hash
    const tokenHash = hashToken(adminToken);

    // Get all events where this admin token matches
    const eventsSnapshot = await db.collection('events')
      .where('admin_token_hash', '==', tokenHash)
      .get();

    const events = [];

    for (const doc of eventsSnapshot.docs) {
      const eventData = doc.data();
      
      // Only include finalized or archived events
      if (eventData.is_finalized || eventData.status === 'archived') {
        // Get team count for this event
        const teamsSnapshot = await db.collection('teams')
          .where('event_id', '==', doc.id)
          .get();

        events.push({
          id: doc.id,
          name: eventData.name,
          mode: eventData.eventMode || 'quick',
          status: eventData.status || 'active',
          is_finalized: eventData.is_finalized || false,
          finalized_at: eventData.finalized_at || null,
          created_at: eventData.created_at,
          number_of_days: eventData.number_of_days || 1,
          team_count: teamsSnapshot.size,
          public_token: eventData.public_token,
        });
      }
    }

    events.sort((a, b) => {
      const aValue = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
      const bValue = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
      return bValue - aValue;
    });

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
