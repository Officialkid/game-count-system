// app/api/public/events/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';

export async function GET() {
  try {
    // Get all active events with public share links
    const events = await db.getPublicEvents();

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          events,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to fetch public events',
      },
      { status: 500 }
    );
  }
}
