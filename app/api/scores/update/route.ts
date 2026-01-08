/**
 * Update Score API
 * Allows admin/scorer to edit an existing score entry
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';
import { query } from '@/lib/db-client';
import { z } from 'zod';

const UpdateScoreSchema = z.object({
  score_id: z.string().uuid(),
  points: z.number().int(),
  category: z.string().min(1).max(100).optional(),
});

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-scorer-token') || request.headers.get('x-admin-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 401 }
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

    // Verify token has access (scorer or admin)
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;

    if (!event || event.id !== score.event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or access denied' },
        { status: 403 }
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

    return NextResponse.json({ success: true, data: updateResult.rows[0] });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update score error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update score' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-scorer-token') || request.headers.get('x-admin-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 401 }
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

    // Verify token has access (scorer or admin)
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;

    if (!event || event.id !== score.event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or access denied' },
        { status: 403 }
      );
    }

    // Delete the score
    await query(`DELETE FROM scores WHERE id = $1`, [scoreId]);

    return NextResponse.json({ success: true, message: 'Score deleted' });
  } catch (error) {
    console.error('Delete score error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete score' },
      { status: 500 }
    );
  }
}
