/**
 * Quick Create API Route
 * One-click event creation that does EVERYTHING
 * Creates event + tokens + teams in a single request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventWithTokens, buildEventShareLinks } from '@/lib/server/event-service';
import { createTeamsForEvent } from '@/lib/server/team-service';
import {
  parseTeamNames,
  validateQuickEventInput,
  calculateQuickEventDates,
  formatQuickEventSummary,
  QuickEventResponse
} from '@/lib/quick-event-helpers';

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

    const createdEvent = await createEventWithTokens({
      name,
      numberOfDays,
      scoringMode: numberOfDays === 1 ? 'continuous' : 'daily',
      eventMode: 'quick',
      requiresAuthentication: false,
      startAt: new Date(startDate),
    });

    const event = {
      id: createdEvent.event.id,
      name: createdEvent.event.name,
      start_at: createdEvent.event.startAt.toISOString(),
      end_at: createdEvent.event.endAt.toISOString(),
    } as any;

    // Create teams if provided
    const createdTeams = teamNames.length > 0
      ? await createTeamsForEvent(
          createdEvent.event.id,
          teamNames.map((teamName) => ({ name: teamName.trim() }))
        )
      : [];

    // Generate shareable links
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}` ||
      'https://game-count-system.vercel.app';

    const routeLinks = buildEventShareLinks(createdEvent.event.id, createdEvent.tokens, baseUrl);
    const links = {
      admin: routeLinks.admin,
      scorer: routeLinks.scorer,
      viewer: routeLinks.viewer,
      scoreboard: routeLinks.viewer,
    };

    // Generate summary
    const summary = formatQuickEventSummary(event, createdTeams.length);

    // Return everything needed
    const response: QuickEventResponse = {
      success: true,
      event,
      tokens: {
        admin_token: createdEvent.tokens.admin_token,
        scorer_token: createdEvent.tokens.scorer_token,
        viewer_token: createdEvent.tokens.public_token
      },
      teams: createdTeams.map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
      })),
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
