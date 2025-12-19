/**
 * Appwrite Recaps Service
 * 
 * Event recap snapshots and statistics
 * APPWRITE HOOK: Replace mockRecapService with this when NEXT_PUBLIC_USE_APPWRITE_SERVICES=true
 */

import { databases } from '@/lib/appwrite';
import { Query, ID, Permission } from 'appwrite';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'recaps';

export interface RecapSnapshot {
  event_id: string;
  event_name: string;
  total_games: number;
  total_teams: number;
  final_leaderboard: Array<{
    team_id: string;
    team_name: string;
    total_points: number;
    rank: number;
  }>;
  top_scorer?: {
    team_id: string;
    team_name: string;
    total_points: number;
  };
  winner?: {
    team_id: string;
    team_name: string;
    total_points: number;
  };
  highlights?: string[];
}

export interface Recap {
  $id: string;
  event_id: string;
  snapshot: RecapSnapshot;
  generated_at: string;
}

// Lightweight summary used by recap page highlights
export async function getSummary(_userId: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc('generated_at'),
      Query.limit(1),
    ]);

    if (!result.documents.length) {
      return {
        success: true,
        data: { mvpTeam: undefined, totalGames: 0, topTeam: undefined },
      };
    }

    const recap = result.documents[0] as unknown as Recap;
    const snapshot = (recap as any)?.snapshot as RecapSnapshot | undefined;
    const leader = snapshot?.final_leaderboard?.[0];

    return {
      success: true,
      data: {
        mvpTeam: leader?.team_name,
        totalGames: snapshot?.total_games ?? 0,
        topTeam: leader?.team_name,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch recap summary' };
  }
}

export async function createRecap(userId: string, eventId: string, snapshot: RecapSnapshot) {
  try {
    const docId = ID.unique();

    const payload = {
      event_id: eventId,
      snapshot: snapshot, // Stored as JSON in Appwrite
      generated_at: new Date().toISOString(),
    };

    // Document-level permission: creator only
    const permissions = [
      Permission.read(`user:${userId}`),
      Permission.update(`user:${userId}`),
      Permission.delete(`user:${userId}`),
    ];

    const recap = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      payload,
      permissions
    );

    return { success: true, data: { recap: recap as unknown as Recap } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create recap' };
  }
}

export async function getRecap(recapId: string) {
  try {
    const recap = await databases.getDocument(DATABASE_ID, COLLECTION_ID, recapId);
    return { success: true, data: { recap: recap as unknown as Recap } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Recap not found' };
  }
}

export async function getEventRecaps(eventId: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', eventId),
      Query.orderDesc('generated_at'),
    ]);

    return {
      success: true,
      data: { recaps: result.documents as unknown as Recap[] },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch recaps' };
  }
}

export async function getLatestRecap(eventId: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', eventId),
      Query.orderDesc('generated_at'),
      Query.limit(1),
    ]);

    if (result.documents.length === 0) {
      return { success: false, error: 'No recap found for this event' };
    }

    return {
      success: true,
      data: { recap: result.documents[0] as unknown as Recap },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch latest recap' };
  }
}

export async function deleteRecap(recapId: string) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, recapId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete recap' };
  }
}
