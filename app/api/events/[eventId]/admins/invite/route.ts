// app/api/events/[eventId]/admins/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireEventPermission } from '@/lib/middleware';
import { db, createAdminInvitation, logAdminActivity, listEventAdmins, listEventInvitations } from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/events/[eventId]/admins/invite
 * Create an invitation for a new admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  // Check if user has permission to manage admins
  const permissionResult = await requireEventPermission(request, eventId, 'canManageAdmins');
  if (!permissionResult.authenticated) return permissionResult.error;

  const { user, role, newToken } = permissionResult;

  try {
    const body = await request.json();
    const { email, role: inviteeRole } = body;

    // Validate inputs
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!inviteeRole || !['admin', 'judge', 'scorer'].includes(inviteeRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be admin, judge, or scorer' },
        { status: 400 }
      );
    }

    // Check if user is already an admin
    const existingAdmins = await listEventAdmins(eventId);
    const existingAdmin = existingAdmins.find(
      (admin) => admin.user_email.toLowerCase() === email.toLowerCase()
    );

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'User is already an administrator of this event' },
        { status: 409 }
      );
    }

    // Check for pending invitations
    const pendingInvitations = await listEventInvitations(eventId);
    const existingInvite = pendingInvitations.find(
      (inv) => inv.invitee_email.toLowerCase() === email.toLowerCase()
    );

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'An invitation has already been sent to this email' },
        { status: 409 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation
    const invitation = await createAdminInvitation(
      eventId,
      user.userId,
      email.toLowerCase(),
      inviteeRole,
      token,
      expiresAt
    );

    // Log admin activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    await logAdminActivity(
      eventId,
      user.userId,
      role,
      'invite_admin',
      'invitation',
      invitation.id,
      { email, role: inviteeRole },
      ipAddress,
      userAgent
    );

    // Send invitation email
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;
    
    const { emailService } = await import('@/lib/email-service');
    const inviterDetails = await db.findUserById(user.userId);
    const eventDetails = await db.getEventById(eventId);
    const emailSent = await emailService.sendAdminInvitation(email.toLowerCase(), {
      inviterName: inviterDetails?.name || user.email || 'An administrator',
      eventName: eventDetails?.event_name || 'an event',
      role: inviteeRole,
      invitationUrl,
      expiresAt: expiresAt.toISOString(),
    });

    if (!emailSent) {
      console.warn(`[ADMIN INVITE] Failed to send email to ${email}, but invitation created`);
    }
    
    console.log(`[ADMIN INVITE] Invitation sent to ${email}, URL: ${invitationUrl}`);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          invitation: {
            id: invitation.id,
            email: invitation.invitee_email,
            role: invitation.role,
            expires_at: invitation.expires_at,
          },
          invitationUrl, // Return URL for development/testing
        },
      },
      { status: 201 }
    );

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
  } catch (error) {
    console.error('Error creating admin invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
