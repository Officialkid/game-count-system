/**
 * Appwrite Teams Service
 * 
 * CRUD operations for teams collection
 * APPWRITE HOOK: Replace mockTeamsService with this when NEXT_PUBLIC_USE_APPWRITE_SERVICES=true
 */

import { databases } from '@/lib/appwrite';
import { Query, ID, Permission } from 'appwrite';
import { handleAppwriteError } from '@/lib/error-handler';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'teams';

export interface TeamData {
  event_id: string;
  team_name: string;
}

export interface Team extends TeamData {
  $id: string;
  total_points: number;
  created_at?: string;
}

export async function getTeams(eventId: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', eventId),
      Query.orderDesc('total_points'),
    ]);

    return {
      success: true,
      data: { teams: result.documents as unknown as Team[] },
    };
  } catch (err: any) {
    return handleAppwriteError(err, 'Teams');
  }
}

export async function getTeam(teamId: string) {
  try {
    const team = await databases.getDocument(DATABASE_ID, COLLECTION_ID, teamId);
    return { success: true, data: { team: team as unknown as Team } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Team not found' };
  }
}

export async function createTeam(userId: string, teamData: TeamData) {
  try {
    const docId = ID.unique();

    const payload = {
      event_id: teamData.event_id,
      team_name: teamData.team_name,
      total_points: 0,
      created_at: new Date().toISOString(),
    };

    // Document-level permission: creator write + public read for scoreboards
    const permissions = [
      Permission.read(`user:${userId}`),
      Permission.update(`user:${userId}`),
      Permission.delete(`user:${userId}`),
      Permission.read('any'), // Allow public read for scoreboards
    ];

    const team = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      payload,
      permissions
    );

    return { success: true, data: { team: team as unknown as Team } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create team' };
  }
}

export async function updateTeam(teamId: string, updates: Partial<TeamData>) {
  try {
    const team = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, teamId, updates);
    return { success: true, data: { team: team as unknown as Team } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update team' };
  }
}

export async function deleteTeam(teamId: string) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, teamId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete team' };
  }
}

export async function checkTeamName(eventId: string, teamName: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('event_id', eventId),
      Query.equal('team_name', teamName),
    ]);

    const available = result.documents.length === 0;

    // If taken, suggest variations
    const suggestions = available ? [] : [
      `${teamName} 2`,
      `${teamName} (Copy)`,
      `${teamName} Team`,
    ];

    return {
      success: true,
      data: { available, suggestions },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to check team name' };
  }
}

export async function updateTeamTotalPoints(teamId: string, totalPoints: number) {
  try {
    const team = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, teamId, {
      total_points: totalPoints,
    });
    return { success: true, data: { team: team as unknown as Team } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update team points' };
  }
}
