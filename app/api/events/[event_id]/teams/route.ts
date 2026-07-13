/**
 * Get Teams for Event
 * GET /api/events/[event_id]/teams
 * Returns all teams for a specific event
 */

import { NextResponse } from 'next/server';
import { getTeamsForEvent } from '@/lib/server/team-service';
import { requireAnyToken } from '@/lib/token-middleware';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
    const accessToken =
      request.headers.get('x-scorer-token') ||
      request.headers.get('x-admin-token') ||
      bearerToken;
    
    const validation = await requireAnyToken(event_id, accessToken);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const teams = await getTeamsForEvent(event_id);

    return NextResponse.json({
      success: true,
      data: { teams }
    });
  } catch (error: any) {
    console.error('Get teams error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get teams',
        details: error.message
      },
      { status: 500 }
    );
  }
}
