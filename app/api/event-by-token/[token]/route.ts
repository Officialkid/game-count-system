/**
 * Get Event by Token
 * GET /api/event-by-token/{token}
 * Works with admin, scorer, or public tokens
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Determine token type by checking DB, and require matching header for admin/scorer tokens
    const headerAdmin = request.headers.get('x-admin-token');
    const headerScorer = request.headers.get('x-scorer-token');

    // If token corresponds to an admin token in DB, require header to match
    const adminEvent = await getEventByToken(token, 'admin');
    let event: any = null;
    if (adminEvent) {
      if (!headerAdmin || headerAdmin !== token) {
        return NextResponse.json(
          errorResponse('UNAUTHORIZED', 'Admin token required'),
          { status: ERROR_STATUS_MAP.UNAUTHORIZED }
        );
      }
      // Use admin-level event
      event = adminEvent;
    } else {
      // If token corresponds to a scorer token, require scorer header
      const scorerEvent = await getEventByToken(token, 'scorer');
      if (scorerEvent) {
        if (!headerScorer || headerScorer !== token) {
          return NextResponse.json(
            errorResponse('UNAUTHORIZED', 'Scorer token required'),
            { status: ERROR_STATUS_MAP.UNAUTHORIZED }
          );
        }
        event = scorerEvent;
      } else {
        // Treat as public token
        event = await getEventByToken(token, 'public');
      }
    }
    
    if (!event) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Invalid or expired token'),
        { status: ERROR_STATUS_MAP.NOT_FOUND }
      );
    }
    
    // Check if event is expired
    if (event.status === 'expired') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'GONE',
            message: 'Event has expired',
            expired_at: event.end_at
          }
        },
        { status: 410 }
      );
    }
    
    // Return event info (hide sensitive tokens - only admin receives tokens)
    const response: any = {
      id: event.id,
      name: event.name,
      mode: event.mode,
      status: event.status,
      start_at: event.start_at,
      end_at: event.end_at,
      created_at: event.created_at,
    };
    // Include tokens only for admin access
    if (adminEvent) {
      response.admin_token = event.admin_token;
      response.scorer_token = event.scorer_token;
      response.public_token = event.public_token;
    }
    
    return NextResponse.json(
      successResponse({ event: response }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get event by token error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to get event'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR }
    );
  }
}
