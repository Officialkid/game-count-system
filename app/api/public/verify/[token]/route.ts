import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token || typeof token !== 'string') {
      return NextResponse.json<APIResponse>({ success: false, error: 'Invalid token' }, { status: 400 });
    }

    const link = await db.findShareLinkByToken(token);
    if (!link) {
      return NextResponse.json<APIResponse>({ success: false, data: { exists: false } }, { status: 404 });
    }

    const event = await db.getEventById(String(link.event_id));
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        exists: true,
        event: event ? { id: event.id, event_name: event.event_name } : null,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Token verify error:', error);
    return NextResponse.json<APIResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
