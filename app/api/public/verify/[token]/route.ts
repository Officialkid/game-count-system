/**
 * Public Token Verify API
 * Returns 200 with event summary if public token is valid; 404 otherwise
 */

import { NextResponse } from 'next/server';
import { getEventByToken } from '@/lib/db-access';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const event = await getEventByToken(token, 'public');

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        name: event.name,
        mode: event.mode,
        status: event.status,
      },
    });
  } catch (error) {
    console.error('Public token verify error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
