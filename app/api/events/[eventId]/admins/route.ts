// app/api/events/[eventId]/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireEventPermission } from '@/lib/middleware';
import * as db from '@/lib/db';

/**
 * GET /api/events/[eventId]/admins
 * List all admins for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  // Check if user has view access (any admin can view)
  const permissionResult = await requireEventPermission(request, eventId, 'canViewActivityLog');
  if (!permissionResult.authenticated) return permissionResult.error;

  const { newToken } = permissionResult;

  try {
    const admins = await db.listEventAdmins(eventId);
    const invitations = await db.listEventInvitations(eventId);

    const response = NextResponse.json({
      success: true,
      data: {
        admins,
        invitations,
      },
    });

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
  } catch (error) {
    console.error('Error listing admins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch administrators' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[eventId]/admins?userId=xxx
 * Remove an admin from an event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  // Check if user has permission to manage admins
  const permissionResult = await requireEventPermission(request, eventId, 'canManageAdmins');
  if (!permissionResult.authenticated) return permissionResult.error;

  const { user, role, newToken } = permissionResult;

  try {
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Prevent removing self
    if (targetUserId === user.userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove yourself as an administrator' },
        { status: 400 }
      );
    }

    // Get target admin details before removing
    const admins = await db.listEventAdmins(eventId);
    const targetAdmin = admins.find((admin) => admin.user_id === targetUserId);

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: 'Administrator not found' },
        { status: 404 }
      );
    }

    // Remove admin
    const removed = await db.removeEventAdmin(eventId, targetUserId);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove administrator. Cannot remove event owner.' },
        { status: 400 }
      );
    }

    // Log admin activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    await db.logAdminActivity(
      eventId,
      user.userId,
      role,
      'remove_admin',
      'admin',
      targetUserId,
      { removed_user_email: targetAdmin.user_email, removed_role: targetAdmin.role },
      ipAddress,
      userAgent
    );

    const response = NextResponse.json({
      success: true,
      message: 'Administrator removed successfully',
    });

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
  } catch (error) {
    console.error('Error removing admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove administrator' },
      { status: 500 }
    );
  }
}
