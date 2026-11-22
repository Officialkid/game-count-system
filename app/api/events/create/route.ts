/**
 * Events API - Create New Event (Unified Creator)
 * POST /api/events/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildEventShareLinks, createAuditLog, createEventWithTokens } from '@/lib/server/event-service';
import { createTeamsForEvent } from '@/lib/server/team-service';
import { sanitizeApiError } from '@/lib/server/prisma';
import { resolveAppBaseUrl } from '@/lib/app-url';
import { badRequest, created, internalError } from '@/lib/api-responses';
import type { EventMode, ScoringMode } from '@/lib/event-domain';

interface CreateEventRequest {
  name: string;
  number_of_days: number;
  scoringMode?: ScoringMode;
  eventMode?: EventMode;
  requiresAuthentication?: boolean;
  organizationId?: string;
  organizationName?: string;
  createdBy?: string;
  startDate?: string;
  dayLabels?: string[];
  teamNames?: string[];
  showPublicActivity?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateEventRequest = await request.json();
    const {
      name,
      number_of_days,
      scoringMode,
      eventMode,
      requiresAuthentication,
      organizationId,
      createdBy,
      startDate,
      dayLabels,
      teamNames,
      showPublicActivity,
    } = body;

    if (!name || !name.trim()) {
      return badRequest('Event name is required');
    }

    const daysCount = Number(number_of_days);
    if (!daysCount || daysCount < 1 || daysCount > 30) {
      return badRequest('Number of days must be between 1 and 30');
    }

    const resolvedMode: EventMode =
      eventMode ?? (daysCount > 3 ? 'camp' : daysCount > 1 ? 'camp' : 'quick');
    const resolvedScoringMode: ScoringMode =
      scoringMode ?? (daysCount > 1 ? 'daily' : 'continuous');
    const parsedStart = startDate ? new Date(`${startDate}T08:00:00`) : new Date();
    const validStart = Number.isNaN(parsedStart.getTime()) ? new Date() : parsedStart;

    const createdEvent = await createEventWithTokens({
      name,
      numberOfDays: daysCount,
      scoringMode: resolvedScoringMode,
      eventMode: resolvedMode,
      requiresAuthentication: requiresAuthentication ?? false,
      organizationId,
      createdBy,
      startAt: validStart,
      dayLabels,
      showPublicActivity: showPublicActivity ?? true,
    });

    // Optionally create initial teams in the same request
    const cleanedTeamNames = Array.isArray(teamNames)
      ? Array.from(
          new Set(
            teamNames
              .map((t) => (typeof t === 'string' ? t.trim() : ''))
              .filter(Boolean)
          )
        )
      : [];

    const createdTeams =
      cleanedTeamNames.length > 0
        ? await createTeamsForEvent(
            createdEvent.event.id,
            cleanedTeamNames.map((teamName) => ({ name: teamName }))
          )
        : [];

    const baseUrl = resolveAppBaseUrl(request);
    const shareLinks = buildEventShareLinks(
      createdEvent.event.id,
      createdEvent.tokens,
      baseUrl
    );

    await createAuditLog({
      eventId: createdEvent.event.id,
      action: 'create',
      entityType: 'event',
      entityId: createdEvent.event.id,
      actorTokenType: 'admin',
      payload: {
        name: createdEvent.event.name,
        eventMode: createdEvent.event.eventMode,
        scoringMode: createdEvent.event.scoringMode,
        numberOfDays: createdEvent.event.numberOfDays,
        teamCount: createdTeams.length,
      },
    });

    return created(
      {
        event: {
          id: createdEvent.event.id,
          name: createdEvent.event.name,
          eventMode: createdEvent.event.eventMode,
          eventStatus: createdEvent.event.eventStatus,
          number_of_days: createdEvent.event.numberOfDays,
          active_day_number: createdEvent.event.activeDayNumber,
          start_at: createdEvent.event.startAt.toISOString(),
          end_at: createdEvent.event.endAt.toISOString(),
        },
        teams: createdTeams,
        tokens: createdEvent.tokens,
        shareLinks,
        modeInfo: createdEvent.modeInfo,
      },
      'Event created! Your Admin link is saved on this device.'
    );
  } catch (error) {
    console.error('Create event error:', error);
    return internalError(
      'Failed to create event',
      sanitizeApiError(error, 'Failed to create event')
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
