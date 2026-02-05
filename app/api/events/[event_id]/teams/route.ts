/**
 * Get Teams for Event
 * GET /api/events/[event_id]/teams
 * Returns all teams for a specific event
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const scorerToken = request.headers.get('x-scorer-token');
    
    if (!scorerToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing scorer token'
        },
        { status: 401 }
      );
    }

    // Get all teams for this event
    const teamsSnapshot = await db.collection('teams')
      .where('event_id', '==', event_id)
      .orderBy('name', 'asc')
      .get();

    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: { teams }
    });
  } catch (error: any) {
    console.error('Get teams error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get teams',
        details: error.message
      },
      { status: 500 }
    );
  }
}
