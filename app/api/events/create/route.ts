/**
 * Events API - Create New Event
 * POST /api/events/create
 * Phase 1 Neon/Prisma migration slice
 */

import { NextResponse } from 'next/server';
import { buildEventShareLinks, createAuditLog, createEventWithTokens } from '@/lib/server/event-service';
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
}

export async function POST(request: Request) {
  try {
    const body: CreateEventRequest = await request.json();
    const {
      name,
      number_of_days,
      scoringMode = 'continuous',
      eventMode = 'quick',
      requiresAuthentication,
      organizationId,
      createdBy,
    } = body;

    if (!name || !name.trim()) {
      return badRequest('Event name is required');
    }

    if (!number_of_days || number_of_days < 1) {
      return badRequest('Number of days must be at least 1');
    }

    const createdEvent = await createEventWithTokens({
      name,
      numberOfDays: number_of_days,
      scoringMode,
      eventMode,
      requiresAuthentication,
      organizationId,
      createdBy,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'https://game-count-system.vercel.app';
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
      },
    });

    return created(
      {
        event: {
          id: createdEvent.event.id,
          name: createdEvent.event.name,
          eventMode: createdEvent.event.eventMode,
          eventStatus: createdEvent.event.eventStatus,
          start_at: createdEvent.event.startAt.toISOString(),
          end_at: createdEvent.event.endAt.toISOString(),
        },
        tokens: createdEvent.tokens,
        shareLinks,
        modeInfo: createdEvent.modeInfo,
      },
      'IMPORTANT: Save these tokens! They will not be shown again.'
    );
  } catch (error) {
    console.error('Create event error:', error);
    return internalError(
      'Failed to create event',
      error instanceof Error ? error.message : 'Unknown error'
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
