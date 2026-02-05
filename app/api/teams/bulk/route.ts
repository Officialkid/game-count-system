/**
 * Bulk Create Teams
 * POST /api/teams/bulk
 * Creates multiple teams at once for an event
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { event_id, teams } = body;

    if (!event_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing event_id'
        },
        { status: 400 }
      );
    }

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teams array is required and must not be empty'
        },
        { status: 400 }
      );
    }

    // Validate each team
    for (const team of teams) {
      if (!team.name || !team.name.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'All teams must have a name'
          },
          { status: 400 }
        );
      }
      if (team.name.length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: 'Team names must be 100 characters or less'
          },
          { status: 400 }
        );
      }
    }

    // Create all teams
    const createdTeams = [];
    const batch = db.batch();

    for (const team of teams) {
      const teamRef = db.collection('teams').doc();
      const teamData = {
        event_id,
        name: team.name.trim(),
        color: team.color || '#3B82F6',
        total_points: 0,
        created_at: new Date().toISOString(),
      };
      
      batch.set(teamRef, teamData);
      createdTeams.push({
        id: teamRef.id,
        ...teamData
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        count: createdTeams.length,
        teams: createdTeams
      }
    });
  } catch (error: any) {
    console.error('Bulk create teams error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create teams',
        details: error.message
      },
      { status: 500 }
    );
  }
}
