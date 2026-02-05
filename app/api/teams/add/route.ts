/**
 * Teams API - Add Team to Event
 * Converted from PostgreSQL to Firestore
 * POST /api/teams/add
 */

import { NextResponse } from 'next/server';
import { adminCreateDocument, adminQueryCollection, adminGetDocument } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS } from '@/lib/firebase-collections';

interface AddTeamRequest {
  event_id: string;
  name: string;
  color?: string;
}

export async function POST(request: Request) {
  try {
    const body: AddTeamRequest = await request.json();
    const { event_id, name, color = '#3B82F6' } = body;

    // Validation
    if (!event_id || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Event ID and team name are required' },
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

    // Check for duplicate team name in this event
    const existingTeams = await adminQueryCollection(COLLECTIONS.TEAMS, [
      { field: 'event_id', operator: '==', value: event_id },
      { field: 'name', operator: '==', value: name.trim() },
    ]);

    if (existingTeams.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A team with this name already exists in this event' },
        { status: 409 }
      );
    }

    // Create team
    const teamData = {
      event_id,
      name: name.trim(),
      color,
    };

    const teamId = await adminCreateDocument(COLLECTIONS.TEAMS, teamData);

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: teamId,
          ...teamData,
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Add team error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
