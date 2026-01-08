/**
 * Bulk Teams API
 * POST /api/teams/bulk - Create multiple teams at once
 * Requires: X-ADMIN-TOKEN header
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { transaction } from '@/lib/db-client';
import { getEventByToken, addTeam } from '@/lib/db-access';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

// Validation schema for bulk team creation
const BulkTeamSchema = z.object({
  event_id: z.string().uuid('Invalid event ID format'),
  teams: z.array(
    z.object({
      name: z.string()
        .min(1, 'Team name is required')
        .max(100, 'Team name must be 100 characters or less')
        .transform(s => s.trim()),
      color: z.string()
        .max(20, 'Color value too long')
        .nullable()
        .optional()
        .default('#6B7280'),
      avatar_url: z.string()
        .url('Invalid avatar URL')
        .nullable()
        .optional(),
    })
  )
  .min(1, 'At least one team is required')
  .max(50, 'Cannot create more than 50 teams at once'),
});

export async function POST(request: Request) {
  try {
    // Get admin token from header
    const adminToken = request.headers.get('x-admin-token');
    
    if (!adminToken) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'X-ADMIN-TOKEN header required'),
        { status: ERROR_STATUS_MAP.UNAUTHORIZED }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    let validated;
    try {
      validated = BulkTeamSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const message = firstError?.message || 'Invalid input data';
        return NextResponse.json(
          errorResponse('VALIDATION_ERROR', message),
          { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
        );
      }
      throw error;
    }

    // Verify admin token has access to this event
    const event = await getEventByToken(adminToken, 'admin');
    
    if (!event || event.id !== validated.event_id) {
      return NextResponse.json(
        errorResponse('FORBIDDEN', 'Invalid token or access denied'),
        { status: ERROR_STATUS_MAP.FORBIDDEN }
      );
    }

    // Check event is active
    if (event.status !== 'active') {
      return NextResponse.json(
        errorResponse('BAD_REQUEST', 'Event is not active'),
        { status: ERROR_STATUS_MAP.BAD_REQUEST }
      );
    }

    // Check for duplicate names in the request (case-insensitive)
    const names = validated.teams.map(t => t.name.toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      const duplicateName = validated.teams.find(t => t.name.toLowerCase() === duplicates[0])?.name;
      return NextResponse.json(
        errorResponse(
          'VALIDATION_ERROR',
          `Duplicate team name in request: "${duplicateName}"`
        ),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR }
      );
    }

    // Use transaction to create all teams atomically
    const results = await transaction(async () => {
      const createdTeams = [];
      
      for (const teamData of validated.teams) {
        try {
          const team = await addTeam({
            event_id: validated.event_id,
            name: teamData.name,
            color: teamData.color || null,
            avatar_url: teamData.avatar_url || null,
          });
          
          createdTeams.push({
            id: team.id,
            name: team.name,
            color: team.color,
            avatar_url: team.avatar_url,
            created_at: team.created_at,
          });
        } catch (error: any) {
          // If any team creation fails, throw to rollback entire transaction
          if (error.message.includes('already exists')) {
            throw new Error(`Team name "${teamData.name}" already exists in this event`);
          }
          throw error;
        }
      }
      
      return createdTeams;
    });

    return NextResponse.json(
      successResponse({
        teams: results,
        count: results.length,
        message: `Successfully created ${results.length} team${results.length > 1 ? 's' : ''}`,
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error('Bulk team creation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          errorResponse('CONFLICT', error.message),
          { status: ERROR_STATUS_MAP.CONFLICT }
        );
      }

      if (error.message.includes('Transaction failed') || error.message.includes('rolled back')) {
        return NextResponse.json(
          errorResponse(
            'INTERNAL_ERROR',
            'Failed to create teams. All changes have been rolled back.'
          ),
          { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
        );
      }
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to create teams'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}

// Block other HTTP methods
export async function GET() {
  return NextResponse.json(
    errorResponse('BAD_REQUEST', 'Method not allowed'),
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    errorResponse('BAD_REQUEST', 'Method not allowed'),
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    errorResponse('BAD_REQUEST', 'Method not allowed'),
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function PATCH() {
  return NextResponse.json(
    errorResponse('BAD_REQUEST', 'Method not allowed'),
    { status: 405, headers: { Allow: 'POST' } }
  );
}
