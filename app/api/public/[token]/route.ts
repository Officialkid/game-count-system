/**
 * Public Scoreboard API
 * GET /api/public/{token}/scores
 * 
 * UNAUTHENTICATED - No headers required
 * Returns complete event data with teams, scores, days, and totals
 * 
 * Responses:
 * - 200: Success with full event data
 * - 404: Token not found (friendly message)
 * - 410: Event expired (with expiry information)
 * - 500: Server error
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { prepareEventForResponse, prepareTeamForResponse, prepareScoreForResponse } from '@/lib/firebase-helpers';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Find event by public token
    const eventsSnapshot = await db.collection('events')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    // Token not found - friendly 404
    if (eventsSnapshot.empty) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event not found',
          message: 'This event link is invalid or no longer exists. Please check your link and try again.'
        },
        { status: 404 }
      );
    }
    
    const eventDoc = eventsSnapshot.docs[0];
    const event: any = {
      id: eventDoc.id,
      ...eventDoc.data()
    };
    
    // Event expired - 410 Gone with expiry information
    if (event.status === 'expired' || event.status === 'archived') {
      const expiryDate = event.expiresAt ? new Date(event.expiresAt).toLocaleDateString() : 'recently';
      return NextResponse.json(
        {
          success: false,
          error: 'Event expired',
          message: `This event ended ${expiryDate !== 'recently' ? `on ${expiryDate}` : expiryDate} and is no longer available.`,
          expired_at: event.expiresAt,
        },
        { status: 410 }
      );
    }
    
    // Get teams with scores
    const teamsSnapshot = await db.collection('events')
      .doc(event.id)
      .collection('teams')
      .orderBy('totalPoints', 'desc')
      .get();
    
    const teams = teamsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      total_points: doc.data().totalPoints || 0
    }));
    
    // Get all scores if needed (for score history)
    let scores: any[] = [];
    let scoresByDay: any[] = [];
    let days: any[] = [];
    
    if (event.mode === 'camp') {
      // Get all scores from all teams
      const scoresPromises = teamsSnapshot.docs.map(async (teamDoc: any) => {
        const scoresSnapshot = await teamDoc.ref
          .collection('scores')
          .orderBy('dayNumber', 'asc')
          .orderBy('createdAt', 'asc')
          .get();
        
        return scoresSnapshot.docs.map((scoreDoc: any) => ({
          id: scoreDoc.id,
          team_id: teamDoc.id,
          team_name: teamDoc.data().name,
          ...scoreDoc.data(),
          day_number: scoreDoc.data().dayNumber
        }));
      });
      
      const scoresArrays = await Promise.all(scoresPromises);
      scores = scoresArrays.flat();
      
      // Extract unique days from scores
      const dayNumbers = [...new Set(scores.map((s: any) => s.day_number))].sort((a, b) => a - b);
      days = dayNumbers.map((dayNum: number) => ({
        day_number: dayNum,
        label: event.dayLabels?.[dayNum] || `Day ${dayNum}`
      }));
      
      // Group scores by day with team breakdown
      scoresByDay = dayNumbers.map((dayNum: number) => {
        const dayScores = scores.filter((s: any) => s.day_number === dayNum);
        return {
          day_number: dayNum,
          day_label: event.dayLabels?.[dayNum] || `Day ${dayNum}`,
          scores: dayScores
        };
      });
    }
    
    // Calculate totals
    const totalPoints = teams.reduce(
      (sum: number, team: any) => sum + (team.total_points || 0),
      0
    );
    const totalScores = scores.length;

    const waiting = event.status === 'active' && teams.length === 0 && totalScores === 0;
    
    // Prepare event data for response
    const preparedEvent = prepareEventForResponse(event);
    
    // Return complete event data
    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: preparedEvent.id,
          name: preparedEvent.name,
          mode: preparedEvent.mode,
          status: preparedEvent.status,
          startDate: preparedEvent.startDate,
          endDate: preparedEvent.endDate,
          isFinalized: preparedEvent.isFinalized,
          finalizedAt: preparedEvent.finalizedAt,
        },
        teams,
        scores,
        scores_by_day: scoresByDay,
        days: days,
        waiting,
        totals: {
          total_teams: teams.length,
          total_scores: totalScores,
          total_points: totalPoints,
          total_days: days.length,
        }
      },
    });
  } catch (error) {
    console.error('Public scoreboard error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Unable to load scoreboard. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Block all mutations - read-only endpoint
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
