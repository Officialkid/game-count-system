/**
 * Scores API - Add Score
 * Converted from PostgreSQL to Firestore
 * POST /api/scores/add
 */

import { NextResponse } from 'next/server';
import { adminCreateDocument, adminGetDocument, adminQueryCollection } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS } from '@/lib/firebase-collections';

interface AddScoreRequest {
  event_id: string;
  team_id: string;
  points: number;
  day?: number;
  penalty?: number;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body: AddScoreRequest = await request.json();
    const { event_id, team_id, points, day, penalty = 0, notes } = body;

    // Validation
    if (!event_id || !team_id) {
      return NextResponse.json(
        { success: false, error: 'Event ID and Team ID are required' },
        { status: 400 }
      );
    }

    if (points === undefined || points === null) {
      return NextResponse.json(
        { success: false, error: 'Points are required' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await adminGetDocument(COLLECTIONS.EVENTS, event_id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify team exists and belongs to this event
    const team = await adminGetDocument(COLLECTIONS.TEAMS, team_id);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    if ((team as any).event_id !== event_id) {
      return NextResponse.json(
        { success: false, error: 'Team does not belong to this event' },
        { status: 400 }
      );
    }

    // Check if event is finalized
    if ((event as any).is_finalized) {
      return NextResponse.json(
        { success: false, error: 'Cannot add scores to a finalized event' },
        { status: 403 }
      );
    }

    // For daily mode, verify day number
    if ((event as any).mode === 'daily' && day) {
      if (day < 1 || day > (event as any).number_of_days) {
        return NextResponse.json(
          { success: false, error: 'Invalid day number' },
          { status: 400 }
        );
      }

      // Check if day is locked
      const eventDays = await adminQueryCollection(COLLECTIONS.EVENT_DAYS, [
        { field: 'event_id', operator: '==', value: event_id },
        { field: 'day_number', operator: '==', value: day },
      ]);

      if (eventDays.length > 0 && (eventDays[0] as any).is_locked) {
        return NextResponse.json(
          { success: false, error: 'This day is locked and cannot accept new scores' },
          { status: 403 }
        );
      }
    }

    // Calculate final score
    const final_score = points - penalty;

    // Create score
    const scoreData = {
      event_id,
      team_id,
      points,
      penalty,
      score: final_score,
      day_number: day || null,
      notes: notes || null,
    };

    const scoreId = await adminCreateDocument(COLLECTIONS.SCORES, scoreData);

    return NextResponse.json({
      success: true,
      data: {
        score: {
          id: scoreId,
          ...scoreData,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Add score error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
