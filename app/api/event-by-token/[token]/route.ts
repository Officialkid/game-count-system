/**
 * Get Event by Token
 * GET /api/event-by-token/{token}
 * Works with admin, scorer, or public tokens
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { prepareEventForResponse } from '@/lib/firebase-helpers';
import { hashToken } from '@/lib/token-utils';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // Hash the incoming token for comparison with stored hashed tokens
    const tokenHash = hashToken(token);
    
    // Determine token type by checking Firestore
    const headerAdmin = request.headers.get('x-admin-token');
    const headerScorer = request.headers.get('x-scorer-token');

    // Helper function to get event by hashed token field
    const getEventByTokenField = async (tokenField: string, tokenHash: string) => {
      const eventsSnapshot = await db.collection('events')
        .where(tokenField, '==', tokenHash)
        .limit(1)
        .get();
      
      if (eventsSnapshot.empty) {
        return null;
      }
      
      const eventDoc = eventsSnapshot.docs[0];
      return {
        id: eventDoc.id,
        ...eventDoc.data()
      };
    };

    // Check if token is an admin token (using correct field name: admin_token_hash)
    const adminEvent = await getEventByTokenField('admin_token_hash', tokenHash);
    let event: any = null;
    
    if (adminEvent) {
      // Require admin header to match
      if (!headerAdmin || headerAdmin !== token) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Admin token required'
            }
          },
          { status: 401 }
        );
      }
      event = adminEvent;
    } else {
      // Check if token is a scorer token (using correct field name: scorer_token_hash)
      const scorerEvent = await getEventByTokenField('scorer_token_hash', tokenHash);
      if (scorerEvent) {
        // Require scorer header to match
        if (!headerScorer || headerScorer !== token) {
          return NextResponse.json(
            {
              success: false,
              data: null,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Scorer token required'
              }
            },
            { status: 401 }
          );
        }
        event = scorerEvent;
      } else {
        // Treat as public token (using correct field name: public_token_hash)
        event = await getEventByTokenField('public_token_hash', tokenHash);
      }
    }
    
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Invalid or expired token'
          }
        },
        { status: 404 }
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
            expired_at: event.endDate
          }
        },
        { status: 410 }
      );
    }
    
    // Prepare event data for response
    const preparedEvent = prepareEventForResponse(event);
    
    // Return event info (hide sensitive tokens - only admin receives tokens)
    const response: any = {
      id: preparedEvent.id,
      name: preparedEvent.name,
      mode: preparedEvent.mode,
      status: preparedEvent.status,
      startDate: preparedEvent.startDate,
      endDate: preparedEvent.endDate,
      createdAt: preparedEvent.createdAt,
    };
    
    // Include plain tokens only for admin access (so admins can share scorer/public links)
    if (adminEvent) {
      response.admin_token = event.admin_token;
      response.scorer_token = event.scorer_token;
      response.public_token = event.public_token;
    }
    
    return NextResponse.json(
      {
        success: true,
        data: { event: response },
        error: null
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get event by token error:', error);
    
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get event',
          details: error.message
        }
      },
      { status: 500 }
    );
  }
}
