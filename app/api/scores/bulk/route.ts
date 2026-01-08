/**
 * Bulk Add Scores API
 * Allows adding scores for multiple teams in one request
 * Requires scorer or admin token
 */

import { NextResponse } from 'next/server';
import { addScore, getEventByToken, createDayIfNotExists } from '@/lib/db-access';
import { transaction } from '@/lib/db-client';
import { z } from 'zod';

const BulkScoreSchema = z.object({
  event_id: z.string().uuid(),
  day_number: z.number().int().min(1).optional().nullable(),
  day_id: z.string().uuid().nullable().optional(),
  category: z.string().min(1).max(100).default('Bulk Entry'),
  items: z.array(
    z.object({
      team_id: z.string().uuid(),
      points: z.number().int(), // can be negative
    })
  ).min(1),
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('x-scorer-token');
    const token = authHeader?.replace('Bearer ', '') || authHeader || '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = BulkScoreSchema.parse(body);

    // Verify token (scorer or admin) for the event
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;

    if (!event || event.id !== validated.event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or event access denied' },
        { status: 403 }
      );
    }

    if (event.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Event is not active' },
        { status: 400 }
      );
    }

    // Auto-create event day if day_number provided
    let dayId: string | null = validated.day_id || null;
    if (validated.day_number) {
      const day = await createDayIfNotExists({
        event_id: validated.event_id,
        day_number: validated.day_number,
        label: `Day ${validated.day_number}`,
      });
      
      // Check if day is locked
      if (day.is_locked) {
        return NextResponse.json(
          { success: false, error: `Day ${validated.day_number} is locked` },
          { status: 400 }
        );
      }
      
      dayId = day.id;
    }

    // Insert all scores in a transaction
    const results = await transaction(async () => {
      const inserted: any[] = [];
      for (const item of validated.items) {
        const score = await addScore({
          event_id: validated.event_id,
          day_id: dayId,
          team_id: item.team_id,
          category: validated.category,
          points: item.points,
        });
        inserted.push(score);
      }
      return inserted;
    });

    return NextResponse.json({ success: true, data: { scores: results } }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Handle locked day error
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.error('Bulk add scores error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add scores' },
      { status: 500 }
    );
  }
}
