/**
 * Team Update & Delete API
 * PATCH  /api/events/{event_id}/teams/{team_id}  — Rename team and/or update color
 * DELETE /api/events/{event_id}/teams/{team_id}  — Delete team (Admin only)
 */

import { NextResponse } from 'next/server';
import prisma, { sanitizeApiError, withDbRetry } from '@/lib/server/prisma';
import { requireAdminToken } from '@/lib/token-middleware';

function getAdminToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : null;
  return request.headers.get('x-admin-token') || bearerToken;
}

export async function PATCH(
  request: Request,
  { params }: { params: { event_id: string; team_id: string } }
) {
  try {
    const { event_id, team_id } = params;
    const validation = await requireAdminToken(event_id, getAdminToken(request));
    if (validation instanceof NextResponse) {
      return validation;
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
    const color = typeof body?.color === 'string' ? body.color.trim() : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json(
        { success: false, error: 'Team name cannot be empty' },
        { status: 400 }
      );
    }

    if (name === undefined && color === undefined) {
      return NextResponse.json(
        { success: false, error: 'Provide name or color to update' },
        { status: 400 }
      );
    }

    const existing = await withDbRetry(() =>
      prisma.team.findFirst({ where: { id: team_id, eventId: event_id } })
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    const updated = await withDbRetry(() =>
      prisma.team.update({
        where: { id: team_id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(color !== undefined ? { color } : {}),
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: updated.id,
          event_id: updated.eventId,
          name: updated.name,
          color: updated.color,
        },
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A team with that name already exists in this event' },
        { status: 409 }
      );
    }
    console.error('Update team error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to update team') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { event_id: string; team_id: string } }
) {
  try {
    const { event_id, team_id } = params;
    const validation = await requireAdminToken(event_id, getAdminToken(request));
    if (validation instanceof NextResponse) {
      return validation;
    }

    const existing = await withDbRetry(() =>
      prisma.team.findFirst({ where: { id: team_id, eventId: event_id } })
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    await withDbRetry(() => prisma.team.delete({ where: { id: team_id } }));

    return NextResponse.json({
      success: true,
      data: { id: team_id },
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { success: false, error: sanitizeApiError(error, 'Failed to delete team') },
      { status: 500 }
    );
  }
}
