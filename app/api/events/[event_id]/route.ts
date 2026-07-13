import { NextResponse } from 'next/server';
import { getEventById, updateEventById } from '@/lib/server/event-service';
import { requireAdminToken } from '@/lib/token-middleware';

function getAdminToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  return request.headers.get('x-admin-token') || bearerToken;
}

export async function GET(request: Request, { params }: { params: { event_id: string } }) {
  try {
    const event = await getEventById(params.event_id);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const teams = event.teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        avatar_url: team.avatarUrl,
        total_points: team.scores.reduce((sum, score) => sum + score.points + (score.bonus ?? 0) - (score.penalty ?? 0), 0),
        score_count: team.scores.length,
      }))
      .sort((a, b) => b.total_points - a.total_points || a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: event.id,
          event_name: event.name,
          name: event.name,
          mode: event.eventMode,
          status: event.eventStatus,
          theme_color: event.themeColor || 'purple',
          allow_negative: false,
          display_mode: 'standard',
          is_finalized: event.isFinalized,
          start_at: event.startAt.toISOString(),
          end_at: event.endAt.toISOString(),
        },
        teams,
        total_teams: teams.length,
        total_scores: teams.reduce((sum, team) => sum + team.score_count, 0),
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get event', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { event_id: string } }) {
  try {
    const token = getAdminToken(request);
    const validation = await requireAdminToken(params.event_id, token);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const body = await request.json();
    const eventName = typeof body?.event_name === 'string' ? body.event_name : undefined;
    const themeColor = typeof body?.theme_color === 'string' ? body.theme_color : undefined;

    if (!eventName && !themeColor) {
      return NextResponse.json({ success: false, error: 'At least one supported event field is required' }, { status: 400 });
    }

    const updated = await updateEventById({
      eventId: params.event_id,
      name: eventName,
      themeColor,
    });

    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: updated.id,
          event_name: updated.name,
          name: updated.name,
          theme_color: updated.themeColor || 'purple',
          allow_negative: false,
          display_mode: 'standard',
        },
        note: 'allow_negative and display_mode are not yet backed by the Prisma schema and were left unchanged.',
      },
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
