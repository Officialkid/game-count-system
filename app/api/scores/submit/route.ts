/**
 * Submit Score with Token Validation
 * Example of protected route using token middleware
 */

import { NextResponse } from 'next/server';
import { adminCreateDocument, adminGetDocument, adminQueryCollection } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS } from '@/lib/firebase-collections';
import { requireScorerToken } from '@/lib/token-middleware';import { canSubmitScoreForDay } from '@/lib/day-locking';import { extractToken } from '@/lib/token-utils';

interface SubmitScoreRequest {
  event_id: string;
  team_id: string;
  points: number;
  penalty?: number;
  day_number?: number;
  token: string;
}

export async function POST(request: Request) {
  try {
    const body: SubmitScoreRequest = await request.json();
    const { event_id, team_id, points, penalty = 0, day_number, token } = body;

    // Validate token and require scorer or admin access
    const validation = await requireScorerToken(event_id, token);
    
    // If validation returns NextResponse, it's an error response
    if (validation instanceof NextResponse) {
      return validation;
    }

    const { event, permissions } = validation;

    // Validate required fields
    if (!team_id || points === undefined) {
      return NextResponse.json(
        { success: false, error: 'Team ID and points are required' },
        { status: 400 }
      );
    }

    // Check if event is finalized
    if ((event as any).is_finalized) {
      return NextResponse.json(
        { success: false, error: 'Cannot add scores to finalized event' },
        { status: 400 }
      );
    }
    // Check if day is locked (for daily events)
    if (day_number !== undefined) {
      const dayCheck = canSubmitScoreForDay(event as any, day_number);
      if (!dayCheck.allowed) {
        return NextResponse.json(
          { success: false, error: dayCheck.reason },
          { status: 403 }
        );
      }
    }
    // Verify team exists
    const team = await adminGetDocument(COLLECTIONS.TEAMS, team_id);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Verify team belongs to event
    if ((team as any).event_id !== event_id) {
      return NextResponse.json(
        { success: false, error: 'Team does not belong to this event' },
        { status: 400 }
      );
    }

    // For daily mode, check if day is locked
    if ((event as any).scoringMode === 'daily' && day_number) {
      const daySnapshot = await adminQueryCollection(
        COLLECTIONS.EVENT_DAYS,
        [
          { field: 'event_id', operator: '==', value: event_id },
          { field: 'day_number', operator: '==', value: day_number },
        ]
      );

      if (daySnapshot.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid day number' },
          { status: 400 }
        );
      }

      const day = daySnapshot[0];
      if (day.is_locked) {
        return NextResponse.json(
          { success: false, error: 'This day is locked and cannot accept new scores' },
          { status: 400 }
        );
      }
    }

    // Calculate final score
    const finalScore = points - penalty;

    // Create score document
    const scoreData = {
      event_id,
      team_id,
      points,
      penalty,
      score: finalScore,
      ...(day_number && { day_number }),
      submitted_by: validation.tokenType, // Track who submitted (admin/scorer)
    };

    const scoreId = await adminCreateDocument(COLLECTIONS.SCORES, scoreData);

    return NextResponse.json({
      success: true,
      data: {
        score: {
          id: scoreId,
          ...scoreData,
        },
        submittedBy: validation.tokenType,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Submit score error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
