/**
 * Quick Create API Route
 * One-click event creation that does EVERYTHING
 * Creates event + tokens + teams in a single request
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateEventTokens } from '@/lib/token-utils';
import {
  parseTeamNames,
  validateQuickEventInput,
  calculateQuickEventDates,
  generateShareableLinks,
  formatQuickEventSummary,
  getRandomTeamColor,
  QuickEventResponse
} from '@/lib/quick-event-helpers';
import { FirebaseEvent, FirebaseTeam } from '@/lib/firebase-collections';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, numberOfDays = 1, teamNames: teamNamesInput } = body;

    // Parse team names from comma-separated string
    const teamNames = typeof teamNamesInput === 'string' 
      ? parseTeamNames(teamNamesInput)
      : (Array.isArray(teamNamesInput) ? teamNamesInput : []);

    // Validate input
    const validation = validateQuickEventInput(name, numberOfDays, teamNames);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Calculate event dates (starts today)
    const { startDate, endDate } = calculateQuickEventDates(numberOfDays);

    // Generate tokens (plain + hashed)
    const tokens = generateEventTokens();

    // Create event in Firestore
    const adminDb = await getAdminDb();
    const eventsRef = adminDb.collection('events');
    const eventRef = await eventsRef.add({
      name: name.trim(),
      scoringMode: numberOfDays === 1 ? 'continuous' : 'daily',
      number_of_days: numberOfDays,
      eventMode: 'quick',
      eventStatus: 'active',
      status: 'active',
      requiresAuthentication: false,
      start_at: startDate,
      end_at: endDate,
      created_at: new Date().toISOString(),
      
      // Token system
      admin_token_hash: tokens.hashed.admin_token_hash,
      scorer_token_hash: tokens.hashed.scorer_token_hash,
      public_token_hash: tokens.hashed.public_token_hash,
      
      // Quick event features
      is_finalized: false,
      finalized_at: null,
      archived_at: null,
      lockedDays: [],
      
      // Auto-cleanup (24 hours after end)
      autoCleanupDate: new Date(
        new Date(endDate).getTime() + 24 * 60 * 60 * 1000
      ).toISOString()
    });

    const eventId = eventRef.id;

    // Fetch the created event
    const eventDoc = await eventRef.get();
    const event = { id: eventId, ...eventDoc.data() } as FirebaseEvent;

    // Create teams if provided
    const createdTeams: Array<{ id: string; name: string; color: string }> = [];
    
    if (teamNames.length > 0) {
      const teamsRef = adminDb.collection('teams');
      const batch = adminDb.batch();

      for (const teamName of teamNames) {
        const teamRef = teamsRef.doc();
        const teamData: Omit<FirebaseTeam, 'id'> = {
          event_id: eventId,
          name: teamName.trim(),
          color: getRandomTeamColor(),
          created_at: new Date().toISOString()
        };

        batch.set(teamRef, teamData);
        createdTeams.push({
          id: teamRef.id,
          name: teamData.name,
          color: teamData.color
        });
      }

      await batch.commit();
    }

    // Generate shareable links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    const links = generateShareableLinks(eventId, {
      admin_token: tokens.plain.admin_token,
      scorer_token: tokens.plain.scorer_token,
      viewer_token: tokens.plain.public_token
    }, baseUrl);

    // Generate summary
    const summary = formatQuickEventSummary(event, createdTeams.length);

    // Return everything needed
    const response: QuickEventResponse = {
      success: true,
      event,
      tokens: {
        admin_token: tokens.plain.admin_token,
        scorer_token: tokens.plain.scorer_token,
        viewer_token: tokens.plain.public_token
      },
      teams: createdTeams,
      links,
      summary
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Quick create error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create event',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Return quick create form info
 * Provides defaults and suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const defaults = {
      numberOfDays: 1,
      suggestedTeamCount: 4,
      maxTeams: 50,
      maxDays: 3,
      eventTypes: [
        { value: 1, label: 'Single Day Event' },
        { value: 2, label: '2-Day Event' },
        { value: 3, label: '3-Day Event' }
      ],
      tips: [
        'Enter team names separated by commas',
        'Leave teams empty to add them later',
        'Quick events auto-delete after 24 hours',
        'Perfect for tournaments, game nights, and competitions'
      ]
    };

    return NextResponse.json({
      success: true,
      defaults
    });

  } catch (error) {
    console.error('Quick create GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch defaults' },
      { status: 500 }
    );
  }
}
