/**
 * Submit Score with Token Validation
 * Example of protected route using token middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/server/prisma';
import { addScoreForEvent, deleteScoreForEvent, updateScoreForEvent } from '@/lib/server/score-service';
import { createAuditLog } from '@/lib/server/event-service';
import { requireScorerToken } from '@/lib/token-middleware';
import { hashToken } from '@/lib/token-utils';

interface SubmitScoreRequest {
  event_id: string;
  team_id: string;
  points: number;
  penalty?: number;
  day_number?: number;
  token: string;
}

export async function POST(request: Request) {
  try {
    const body: SubmitScoreRequest = await request.json();
    const { event_id, team_id, points, penalty = 0, day_number, token } = body;

    // Validate token and require scorer or admin access
    const validation = await requireScorerToken(event_id, token);
    
    // If validation returns NextResponse, it's an error response
    if (validation instanceof NextResponse) {
      return validation;
    }

    const { event, tokenType } = validation;

    // Validate required fields
    if (!team_id || points === undefined) {
      return NextResponse.json(
        { success: false, error: 'Team ID and points are required' },
        { status: 400 }
      );
    }

    // Check if event is finalized
    if ((event as any).isFinalized) {
      return NextResponse.json(
        { success: false, error: 'Cannot add scores to finalized event' },
        { status: 400 }
      );
    }
    const score = await addScoreForEvent({
      eventId: event_id,
      teamId: team_id,
      day: day_number ?? 1,
      points,
      penalty,
      category: 'Score',
      tokenType: tokenType === 'viewer' ? undefined : (tokenType as 'admin' | 'scorer'),
    });

    await createAuditLog({
      eventId: event_id,
      action: 'submit_score',
      entityType: 'score',
      entityId: score.id,
      actorTokenType: tokenType === 'viewer' ? undefined : (tokenType as 'admin' | 'scorer'),
      payload: {
        teamId: team_id,
        points,
        penalty,
        day_number: day_number ?? 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        score,
        submittedBy: tokenType,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Submit score error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit score',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function getAdminEventFromBearer(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const access = await prisma.eventToken.findFirst({
    where: {
      tokenHash,
      tokenType: 'admin',
      isActive: true,
      revokedAt: null,
    },
    include: {
      event: true,
    },
  });

  return access?.event ?? null;
}

export async function PATCH(request: NextRequest) {
  try {
    const event = await getAdminEventFromBearer(request);

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const scoreId = body?.score_id as string | undefined;
    const points = body?.points as number | undefined;
    const category = body?.category as string | undefined;

    if (!scoreId || typeof points !== 'number' || Number.isNaN(points)) {
      return NextResponse.json(
        { success: false, error: 'score_id and valid points are required' },
        { status: 400 }
      );
    }

    const score = await updateScoreForEvent({
      scoreId,
      eventId: event.id,
      points,
      category,
      tokenType: 'admin',
    });

    await createAuditLog({
      eventId: event.id,
      action: 'update',
      entityType: 'score',
      entityId: scoreId,
      actorTokenType: 'admin',
      payload: { points, category: category ?? null },
    });

    return NextResponse.json({
      success: true,
      data: { score },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update score',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const event = await getAdminEventFromBearer(request);

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const scoreId = new URL(request.url).searchParams.get('score_id');

    if (!scoreId) {
      return NextResponse.json(
        { success: false, error: 'score_id is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteScoreForEvent({
      scoreId,
      eventId: event.id,
    });

    await createAuditLog({
      eventId: event.id,
      action: 'delete',
      entityType: 'score',
      entityId: scoreId,
      actorTokenType: 'admin',
      payload: deleted,
    });

    return NextResponse.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete score',
      },
      { status: 500 }
    );
  }
}
