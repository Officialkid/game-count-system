import { NextResponse } from 'next/server';
import { requireAdminToken } from '@/lib/token-middleware';
import { getScoreHistoryForEvent } from '@/lib/server/score-service';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
    const adminToken = request.headers.get('x-admin-token') || bearerToken;

    const validation = await requireAdminToken(params.event_id, adminToken);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const scores = await getScoreHistoryForEvent(params.event_id);

    return NextResponse.json({
      success: true,
      data: { scores },
    });
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load history',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
