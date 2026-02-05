/**
 * Events API - Get Event by ID
 * Converted from PostgreSQL to Firestore
 * GET /api/events/[event_id]
 */

import { NextResponse } from 'next/server';
import { adminGetDocument, adminQueryCollection } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS } from '@/lib/firebase-collections';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;

    if (!event_id) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get event
    const event = await adminGetDocument(COLLECTIONS.EVENTS, event_id);
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get teams for this event
    const teams = await adminQueryCollection(COLLECTIONS.TEAMS, [
      { field: 'event_id', operator: '==', value: event_id },
    ]);

    // Get scores for this event
    const scores = await adminQueryCollection(COLLECTIONS.SCORES, [
      { field: 'event_id', operator: '==', value: event_id },
    ]);

    // Calculate team totals
    const teamTotals = teams.map((team: any) => {
      const teamScores = scores.filter((score: any) => score.team_id === team.id);
      const total = teamScores.reduce((sum: number, score: any) => sum + (score.score || 0), 0);
      
      return {
        ...team,
        total_score: total,
        score_count: teamScores.length,
      };
    });

    // Sort by total score descending
    teamTotals.sort((a, b) => b.total_score - a.total_score);

    return NextResponse.json({
      success: true,
      data: {
        event,
        teams: teamTotals,
        total_teams: teams.length,
        total_scores: scores.length,
      },
    });

  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
