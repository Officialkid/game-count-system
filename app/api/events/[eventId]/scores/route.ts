// app/api/events/[eventId]/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { addScoreSchema } from '@/lib/validations';
import { APIErrorCode } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limiter';
import { sanitizeString } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import { APIResponse } from '@/lib/types';
import { z } from 'zod';
import { publish } from '@/lib/sse';

const batchScoreSchema = z.object({
  scores: z.array(
    z.object({
      team_id: z.string().uuid(),
      game_number: z.number().int().positive(),
      points: z.number().int(),
      submission_id: z.string().max(100).optional(),
    })
  ).min(1).max(20),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  // Rate limit: 5 requests per minute per IP
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }
    const { user } = authResult;
    const eventId = sanitizeString(params.eventId, 64);

    // Verify event ownership
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.NOT_FOUND,
          message: 'Event not found',
          details: { eventId },
        },
      }, { status: 404 });
    }
    if (event.user_id !== user.userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: APIErrorCode.FORBIDDEN,
          message: 'Unauthorized to add scores to this event',
        },
      }, { status: 403 });
    }
    const body = await request.json();
    // Check if it's a batch request
    const isBatch = Array.isArray(body.scores);
    if (isBatch) {
      // Batch score submission
      for (const s of body.scores) {
        if (s.team_id) s.team_id = sanitizeString(s.team_id, 64);
        if (s.submission_id) s.submission_id = sanitizeString(s.submission_id, 100);
      }
      const validation = batchScoreSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: {
            code: APIErrorCode.VALIDATION_ERROR,
            message: validation.error.errors[0].message,
          },
        }, { status: 400 });
      }
      const results = [];
      const errors = [];
      for (const scoreData of validation.data.scores) {
        try {
          // Validate against allow_negative setting
          if (!event.allow_negative && scoreData.points < 0) {
            errors.push({
              team_id: scoreData.team_id,
              error: 'Negative points are not allowed for this event',
            });
            continue;
          }
          const result = await db.upsertGameScore(
            eventId,
            scoreData.team_id,
            scoreData.game_number,
            scoreData.points,
            scoreData.submission_id
          );
          results.push(result);
          publish(`event:${eventId}`, {
            type: 'score_added',
            score: result,
          });
        } catch (error: any) {
          errors.push({
            team_id: scoreData.team_id,
            error: error.message || 'Failed to add score',
          });
        }
      }
      return NextResponse.json({
        success: errors.length === 0,
        data: {
          results,
          errors: errors.length > 0 ? errors : undefined,
        },
      }, { status: errors.length === 0 ? 201 : 207 });
    } else {
      // Single score submission
      if (body.team_id) body.team_id = sanitizeString(body.team_id, 64);
      if (body.submission_id) body.submission_id = sanitizeString(body.submission_id, 100);
      const validation = addScoreSchema.safeParse({ ...body, event_id: eventId });
      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: {
            code: APIErrorCode.VALIDATION_ERROR,
            message: validation.error.errors[0].message,
          },
        }, { status: 400 });
      }
      const { team_id, game_number, points, submission_id } = validation.data;
      // Validate against allow_negative setting
      if (!event.allow_negative && points < 0) {
        return NextResponse.json({
          success: false,
          error: {
            code: APIErrorCode.VALIDATION_ERROR,
            message: 'Negative points are not allowed for this event',
          },
        }, { status: 400 });
      }
      const result = await db.upsertGameScore(
        eventId,
        team_id,
        game_number,
        points,
        submission_id
      );
      publish(`event:${eventId}`, {
        type: 'score_added',
        score: result,
      });
      return NextResponse.json({
        success: true,
        data: { score: result },
      }, { status: 201 });
    }
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

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;

    // Verify event exists
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    const scores = await db.getScoresByEvent(eventId);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: { scores },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get scores error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to get scores',
      },
      { status: 500 }
    );
  }
}
