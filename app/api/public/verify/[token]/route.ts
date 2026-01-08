/**
 * Public Token Verify API
 * GET /api/public/verify/{token}
 *
 * UNAUTHENTICATED - No headers required
 * Returns event summary if public token is valid
 *
 * Responses:
 * - 200: Token valid, event active
 * - 404: Token not found (friendly message)
 * - 410: Event expired (with expiry information)
 * - 500: Server error
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Resolve event ONLY via token - no authentication
    const event = await getEventByToken(token, 'public');

    // Token not found - friendly 404
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event not found',
          message: 'This event link is invalid or no longer exists. Please check your link and try again.',
        },
        { status: 404 }
      );
    }

    // Event expired - 410 Gone with expiry information
    if (event.status === 'expired') {
      return NextResponse.json(
        {
          success: false,
          error: 'Event expired',
          message: `This event ended on ${new Date(event.expires_at!).toLocaleDateString()} and is no longer available.`,
          expired_at: event.expires_at,
        },
        { status: 410 }
      );
    }

    // Success - return event summary
    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        name: event.name,
        mode: event.mode,
        status: event.status,
        start_at: event.start_at,
        end_at: event.end_at,
      },
    });
  } catch (error) {
    console.error('Public token verify error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: 'Unable to verify event. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Block all mutations - read-only endpoint
export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}