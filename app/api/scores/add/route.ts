// app/api/scores/add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { requireEventPermission } from '@/lib/middleware';
import { addScoreSchema } from '@/lib/validations';
import { APIErrorCode } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limiter';
import { sanitizeString } from '@/lib/sanitize';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per minute per IP
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    // Parse and validate request body first to get event_id
    const body = await request.json();
    // Sanitize all string inputs
    if (body.event_id) body.event_id = sanitizeString(body.event_id, 64);
    if (body.team_id) body.team_id = sanitizeString(body.team_id, 64);
    if (body.submission_id) body.submission_id = sanitizeString(body.submission_id, 100);
    const validation = addScoreSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_ERROR,
          message: validation.error.errors[0].message,
        },
      }, { status: 400 });
    }
    const { event_id, team_id, game_number, points, submission_id } = validation.data;

    // Check if user has permission to add scores
    const permissionResult = await requireEventPermission(request, event_id, 'canAddScores');
    if (!permissionResult.authenticated) return permissionResult.error;
    const { user, role, newToken } = permissionResult;

    // Verify event exists
    const event = await db.db.getEventById(event_id);
    if (!event) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.NOT_FOUND,
          message: 'Event not found',
          details: { event_id },
        },
      }, { status: 404 });
    }

    // Verify team exists and belongs to the event
    const team = await db.db.getTeamById(team_id);
    if (!team) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.NOT_FOUND,
          message: 'Team not found',
          details: { team_id },
        },
      }, { status: 404 });
    }
    if (team.event_id !== event_id) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_ERROR,
          message: 'Team does not belong to this event',
        },
      }, { status: 400 });
    }

    // Negative points validation
    if (!event.allow_negative && points < 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_ERROR,
          message: 'Negative points are not allowed for this event',
        },
      }, { status: 400 });
    }

    // Inline existingScoreCheck logic
    const existing = await db.db.getScoresByTeam(team_id);
    const wasUpdated = existing.some((s: any) => s.game_number === game_number);

    // Add or update game score
    const score = await db.db.upsertGameScore(event_id, team_id, game_number, points, submission_id);

    // Log admin activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    await db.logAdminActivity(
      event_id,
      user.userId,
      role,
      wasUpdated ? 'update_score' : 'add_score',
      'score',
      score.id,
      { team_id, game_number, points, previous_points: wasUpdated ? existing.find((s: any) => s.game_number === game_number)?.points : null },
      ipAddress,
      userAgent
    );

    // Return consistent response
    const response = NextResponse.json({
      success: true,
      data: {
        score,
        updated_team: team,
        action: wasUpdated ? 'updated' : 'created',
      },
    }, { status: 201 });

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
  } catch (error: any) {
    logger.error('Add score error', error);
    return NextResponse.json({
      success: false,
      error: {
        code: APIErrorCode.INTERNAL_ERROR,
        message: 'Failed to add score',
        details: error?.message,
      },
    }, { status: 500 });
  }
}
