/**
 * Appwrite Scores Service
 * 
 * CRUD operations for scores collection
 * Supports upsert via composite (event_id, team_id, game_number) uniqueness
 * APPWRITE HOOK: Replace mockScoresService with this when NEXT_PUBLIC_USE_APPWRITE_SERVICES=true
 */

import { databases } from '@/lib/appwrite';
import { Query, ID, Permission } from 'appwrite';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'scores';

export interface ScoreData {
  event_id: string;
  team_id: string;
  game_number: number;
  points: number;
}

export interface Score extends ScoreData {
  $id: string;
  user_id: string;
  created_at: string;
}

export async function getScores(eventId: string, filters?: { teamId?: string; gameNumber?: number }) {
  try {
    const queries = [Query.equal('event_id', eventId)];

    if (filters?.teamId) {
      queries.push(Query.equal('team_id', filters.teamId));
    }

    if (filters?.gameNumber !== undefined) {
      queries.push(Query.equal('game_number', filters.gameNumber));
    }

    queries.push(Query.orderAsc('game_number'));

    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);

    return {
      success: true,
      data: { scores: result.documents as unknown as Score[] },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch scores' };
  }
}

export async function getScore(scoreId: string) {
  try {
    const score = await databases.getDocument(DATABASE_ID, COLLECTION_ID, scoreId);
    return { success: true, data: { score: score as unknown as Score } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Score not found' };
  }
}

export async function addScore(userId: string, scoreData: ScoreData) {
  try {
    // Check if score exists for this game/team combination
    const existingScores = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', scoreData.event_id),
      Query.equal('team_id', scoreData.team_id),
      Query.equal('game_number', scoreData.game_number),
    ]);

    let score: any;

    if (existingScores.documents.length > 0) {
      // Update existing score
      const scoreId = existingScores.documents[0].$id;
      score = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, scoreId, {
        points: scoreData.points,
      });
    } else {
      // Create new score
      const docId = ID.unique();
      const payload = {
        ...scoreData,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      const permissions = [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ];

      score = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        docId,
        payload,
        permissions
      );
    }

    return { success: true, data: { score: score as Score } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add score' };
  }
}

export async function deleteScore(scoreId: string) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, scoreId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete score' };
  }
}

export async function getScoresForTeam(teamId: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('team_id', teamId),
      Query.orderAsc('game_number'),
    ]);

    const totalPoints = result.documents.reduce((sum: number, score: any) => sum + score.points, 0);

    return {
      success: true,
      data: {
        scores: result.documents as unknown as Score[],
        totalPoints,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch team scores' };
  }
}

export async function getLeaderboard(eventId: string) {
  try {
    // Fetch all scores for event
    const scoresResult = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', eventId),
    ]);

    // Group by team and sum points
    const teamTotals: Record<string, number> = {};
    scoresResult.documents.forEach((score: any) => {
      if (!teamTotals[score.team_id]) {
        teamTotals[score.team_id] = 0;
      }
      teamTotals[score.team_id] += score.points;
    });

    // Sort by total points descending
    const leaderboard = Object.entries(teamTotals)
      .map(([teamId, totalPoints]) => ({ teamId, totalPoints }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return {
      success: true,
      data: { leaderboard },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch leaderboard' };
  }
}

export async function getGameStats(eventId: string, gameNumber: number) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', eventId),
      Query.equal('game_number', gameNumber),
    ]);

    const totalPoints = result.documents.reduce((sum: number, score: any) => sum + score.points, 0);

    return {
      success: true,
      data: {
        gameNumber,
        scores: result.documents as unknown as Score[],
        totalPoints,
        teamCount: result.documents.length,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch game stats' };
  }
}

/**
 * Get count of scores created in the last N days for a user
 * Used for dashboard quick stats
 */
export async function getScoresCountLastDays(userId: string, days: number) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const iso = since.toISOString();

    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('user_id', userId),
      Query.greaterThan('created_at', iso),
    ]);

    return {
      success: true,
      data: { count: result.total },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch score stats' };
  }
}
