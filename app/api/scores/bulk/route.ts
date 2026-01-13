/**
 * Bulk Add Scores API
 * Allows adding scores for multiple teams in one request
 * Supports positive and negative points (penalties)
 * Requires scorer or admin token
 * 
 * Transaction-safe: All scores inserted atomically or rolled back on error
 */

import { NextResponse } from 'next/server';
import { addScore, getEventByToken, createDayIfNotExists } from '@/lib/db-access';
import { transaction } from '@/lib/db-client';
import { z } from 'zod';

// Validation schema with support for penalties
const BulkScoreSchema = z.object({
  event_id: z.string().uuid('Invalid event ID format'),
  day_number: z.number().int().min(1).optional().nullable(),
  day_id: z.string().uuid('Invalid day ID format').nullable().optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long').default('Bulk Entry'),
  items: z.array(
    z.object({
      team_id: z.string().uuid('Invalid team ID format'),
      // Allow any integer (positive, negative, or zero)
      points: z.number({
        required_error: 'Points are required',
        invalid_type_error: 'Points must be a number',
      })
      .int('Points must be an integer (no decimals)')
      .refine((val) => Number.isInteger(val), {
        message: 'Points must be a whole number',
      }),
    })
  ).min(1, 'At least one score item is required')
  .max(100, 'Cannot add more than 100 scores at once'), // Reasonable limit
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
    
    // Validate input schema
    let validated;
    try {
      validated = BulkScoreSchema.parse(body);
    } catch (validationError: any) {
      if (validationError?.name === 'ZodError') {
        const errors = validationError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            message: 'Please check your input data',
            details: errors 
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

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
        { 
          success: false, 
          error: 'Event is not active',
          message: `Cannot add scores to ${event.status} event. Event must be active.`
        },
        { status: 400 }
      );
    }

    // Auto-create event day if day_number provided
    let dayId: string | null = validated.day_id || null;
    if (validated.day_number) {
      try {
        const day = await createDayIfNotExists({
          event_id: validated.event_id,
          day_number: validated.day_number,
          label: `Day ${validated.day_number}`,
        });
        
        // Check if day is locked
        if (day.is_locked) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Day is locked',
              message: `Day ${validated.day_number} is locked and cannot accept new scores. Please unlock the day first.`
            },
            { status: 409 }
          );
        }
        
        dayId = day.id;
      } catch (dayError: any) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create day',
            message: dayError instanceof Error ? dayError.message : 'Unable to create event day'
          },
          { status: 500 }
        );
      }
    }

    // Insert all scores in a transaction (atomic operation)
    // All scores are inserted together or none are inserted
    let results;
    try {
      results = await transaction(async () => {
        const inserted: any[] = [];
        let successCount = 0;
        
        for (const item of validated.items) {
          try {
            const score = await addScore({
              event_id: validated.event_id,
              day_id: dayId,
              team_id: item.team_id,
              category: validated.category,
              points: item.points, // Supports positive, negative, or zero
            });
            inserted.push(score);
            successCount++;
          } catch (scoreError: any) {
            // If any score fails, transaction will rollback automatically
            throw new Error(
              `Failed to add score for team ${item.team_id}: ${
                scoreError instanceof Error ? scoreError.message : 'Unknown error'
              }`
            );
          }
        }
        
        return { scores: inserted, count: successCount };
      });
    } catch (transactionError: any) {
      // Transaction rolled back - no scores were added
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction failed',
          message: transactionError instanceof Error 
            ? transactionError.message 
            : 'Failed to add scores. All changes have been rolled back.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      message: `Successfully added ${results.count} score(s)`
    }, { status: 201 });
  } catch (error: any) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON',
          message: 'Request body contains invalid JSON. Please check your data format.'
        },
        { status: 400 }
      );
    }

    // Handle validation errors (should be caught above, but just in case)
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          message: 'Input data validation failed',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    // Handle locked day errors
    if (error instanceof Error && error.message.includes('locked')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Day locked',
          message: error.message 
        },
        { status: 400 }
      );
    }

    // Handle database constraint errors
    if (error?.code === '23503') { // Foreign key violation
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid reference',
          message: 'One or more team IDs or event ID do not exist. Please verify your data.',
        },
        { status: 400 }
      );
    }

    // Generic error handler
    console.error('Bulk add scores error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while adding scores'
      },
      { status: 500 }
    );
  }
}
