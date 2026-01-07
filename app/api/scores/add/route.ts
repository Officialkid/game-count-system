/**
 * Add Score API
 * Requires scorer or admin token
 */

import { NextResponse } from 'next/server';
import { addScore, getEventByToken } from '@/lib/db-access';
import { CreateScoreSchema } from '@/lib/db-validations';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validated = CreateScoreSchema.parse(body);
    
    // Verify token has access to this event (scorer or admin)
    const eventByScorer = await getEventByToken(token, 'scorer');
    const eventByAdmin = await getEventByToken(token, 'admin');
    const event = eventByScorer || eventByAdmin;
    
    if (!event || event.id !== validated.event_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or event access denied' },
        { status: 403 }
      );
    }
    
    // Check event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Event is not active' },
        { status: 400 }
      );
    }
    
    // Add score
    const score = await addScore(validated);
    
    return NextResponse.json(
      {
        success: true,
        data: score,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    // Handle locked day error
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }
    
    console.error('Add score error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add score',
      },
      { status: 500 }
    );
  }
}
