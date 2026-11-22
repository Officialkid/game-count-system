/**
 * Quick Create API Route
 * Creates event + tokens + teams in a single request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEventWithTokens, buildEventShareLinks } from '@/lib/server/event-service';
import { createTeamsForEvent } from '@/lib/server/team-service';
import { sanitizeApiError } from '@/lib/server/prisma';
import { resolveAppBaseUrl } from '@/lib/app-url';
import {
  parseTeamNames,
  validateQuickEventInput,
  calculateQuickEventDates,
  QuickEventResponse,
} from '@/lib/quick-event-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, numberOfDays = 1, teamNames: teamNamesInput } = body;

    const teamNames =
      typeof teamNamesInput === 'string'
        ? parseTeamNames(teamNamesInput)
        : Array.isArray(teamNamesInput)
        ? teamNamesInput
        : [];

    const validation = validateQuickEventInput(name, numberOfDays, teamNames);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { startDate } = calculateQuickEventDates(numberOfDays);

    const createdEvent = await createEventWithTokens({
      name,
      numberOfDays,
      scoringMode: numberOfDays === 1 ? 'continuous' : 'daily',
      eventMode: numberOfDays > 1 ? 'camp' : 'quick',
      requiresAuthentication: false,
      startAt: new Date(startDate),
    });

    const event = {
      id: createdEvent.event.id,
      name: createdEvent.event.name,
      number_of_days: createdEvent.event.numberOfDays,
      start_at: createdEvent.event.startAt.toISOString(),
      end_at: createdEvent.event.endAt.toISOString(),
    } as any;

    const createdTeams =
      teamNames.length > 0
        ? await createTeamsForEvent(
            createdEvent.event.id,
            teamNames.map((teamName) => ({ name: teamName.trim() }))
          )
        : [];

    const baseUrl = resolveAppBaseUrl(request);
    const routeLinks = buildEventShareLinks(
      createdEvent.event.id,
      createdEvent.tokens,
      baseUrl
    );
    const links = {
      admin: routeLinks.admin,
      scorer: routeLinks.scorer,
      viewer: routeLinks.viewer,
      scoreboard: routeLinks.viewer,
    };

    const summary = {
      eventName: createdEvent.event.name,
      days: createdEvent.event.numberOfDays,
      teamCount: createdTeams.length,
      startDate: createdEvent.event.startAt.toLocaleDateString(),
      endDate: createdEvent.event.endAt.toLocaleDateString(),
      duration:
        createdEvent.event.numberOfDays === 1
          ? '1 day'
          : `${createdEvent.event.numberOfDays} days`,
    };

    const response: QuickEventResponse = {
      success: true,
      event,
      tokens: {
        admin_token: createdEvent.tokens.admin_token,
        scorer_token: createdEvent.tokens.scorer_token,
        viewer_token: createdEvent.tokens.public_token,
      },
      teams: createdTeams.map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
      })),
      links,
      summary: summary as any,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Quick create error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create event',
        message: sanitizeApiError(error, 'Failed to create event'),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    defaults: {
      numberOfDays: 1,
      suggestedTeamCount: 3,
      maxTeams: 50,
      maxDays: 14,
      eventTypes: [
        { value: 1, label: 'Single Day Event' },
        { value: 2, label: '2-Day Event' },
        { value: 4, label: '4-Day Camp' },
      ],
    },
  });
}
