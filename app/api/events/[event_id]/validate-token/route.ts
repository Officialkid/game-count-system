/**
 * Token Validation API
 * Validates a token and returns permissions
 */

import { NextResponse } from 'next/server';
import { validateEventToken } from '@/lib/token-middleware';

interface ValidateTokenRequest {
  token: string;
}

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    const body: ValidateTokenRequest = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate token
    const validation = await validateEventToken(event_id, token);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tokenType: validation.tokenType,
        permissions: validation.permissions,
        event: {
          id: event_id,
          name: (validation.event as any).name,
          eventMode: (validation.event as any).eventMode,
          eventStatus: (validation.event as any).eventStatus,
        },
      },
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate token',
      },
      { status: 500 }
    );
  }
}
