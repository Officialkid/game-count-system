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
    
    // Get token type from header (default to public)
    const adminToken = request.headers.get('x-admin-token');
    const scorerToken = request.headers.get('x-scorer-token');
    
    // Determine token type based on which header is provided
    let tokenType: 'admin' | 'scorer' | 'public' = 'public';
    
    if (adminToken === token) {
      tokenType = 'admin';
    } else if (scorerToken === token) {
      tokenType = 'scorer';
    }
    
    // Get event
    const event = await getEventByToken(token, tokenType);
    
    if (!event) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Invalid or expired token'),
        { status: ERROR_STATUS_MAP.NOT_FOUND }
      );
    }
    
    // Return event info (hide sensitive tokens based on access level)
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
    if (tokenType === 'admin') {
      response.admin_token = event.admin_token;
      response.scorer_token = event.scorer_token;
      response.public_token = event.public_token;
    } else if (tokenType === 'scorer') {
      response.scorer_token = event.scorer_token;
      response.public_token = event.public_token;
    } else {
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
