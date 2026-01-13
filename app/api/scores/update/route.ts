/**
 * Update Score API
 * Allows admin/scorer to edit an existing score entry
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';
import { query } from '@/lib/db-client';
import { z } from 'zod';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

const UpdateScoreSchema = z.object({
  score_id: z.string().uuid(),
  points: z.number().int(),
  category: z.string().min(1).max(100).optional(),
});

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-admin-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const validated = UpdateScoreSchema.parse(body);

    // Get the score to verify ownership
    const scoreResult = await query(
      `SELECT s.*, e.id as event_id FROM scores s 
       JOIN events e ON e.id = s.event_id 
       WHERE s.id = $1`,
      [validated.score_id]
    );

    if (scoreResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Score not found' },
        { status: 404 }
      );
    }

    const score = scoreResult.rows[0];

    // Only admin may edit score history
    const eventByAdmin = await getEventByToken(token, 'admin');
    if (!eventByAdmin || eventByAdmin.id !== score.event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Admin token required to edit score history'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }

    // Update the score
    const updateResult = await query(
      `UPDATE scores 
       SET points = $1, category = COALESCE($2, category), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [validated.points, validated.category || null, validated.score_id]
    );

    return NextResponse.json(successResponse(updateResult.rows[0]));
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Validation failed'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }

    console.error('Update score error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to update score'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-admin-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Token required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    const { searchParams } = new URL(request.url);
    const scoreId = searchParams.get('score_id');

    if (!scoreId) {
      return NextResponse.json(
        { success: false, error: 'score_id required' },
        { status: 400 }
      );
    }

    // Get the score to verify ownership
    const scoreResult = await query(
      `SELECT s.*, e.id as event_id FROM scores s 
       JOIN events e ON e.id = s.event_id 
       WHERE s.id = $1`,
      [scoreId]
    );

    if (scoreResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Score not found' },
        { status: 404 }
      );
    }

    const score = scoreResult.rows[0];

    // Only admin may delete historical score entries
    const eventByAdmin = await getEventByToken(token, 'admin');
    if (!eventByAdmin || eventByAdmin.id !== score.event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Admin token required to delete score history'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }

    // Delete the score
    await query(`DELETE FROM scores WHERE id = $1`, [scoreId]);

    return NextResponse.json(successResponse({ message: 'Score deleted' }));
  } catch (error) {
    console.error('Delete score error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to delete score'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
