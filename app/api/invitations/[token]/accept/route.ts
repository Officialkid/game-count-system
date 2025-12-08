// app/api/invitations/[token]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db, getInvitationByToken, acceptAdminInvitation, logAdminActivity } from '@/lib/db';

/**
 * POST /api/invitations/[token]/accept
 * Accept an admin invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const authResult = requireAuth(request);
  if (!authResult.authenticated) return authResult.error;

  const { user, newToken } = authResult;
  const token = params.token;

  try {
    // Get invitation by token
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted' },
        { status: 409 }
      );
    }

    // Check if invitation is revoked
    if (invitation.status === 'revoked') {
      return NextResponse.json(
        { success: false, error: 'This invitation has been revoked' },
        { status: 410 }
      );
    }

    // Check if current user matches invited email (optional - could also allow accepting with different account)
    // For now, we'll allow any authenticated user to accept

    // Accept invitation
    const acceptedInvitation = await acceptAdminInvitation(invitation.id, user.userId);

    // Log activity
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    await logAdminActivity(
      acceptedInvitation.event_id,
      user.userId,
      acceptedInvitation.role,
      'accept_invitation',
      'invitation',
      invitation.id,
      { inviter_id: invitation.inviter_id },
      ipAddress,
      userAgent
    );

    // Send confirmation email to inviter
    const inviterUser = await db.findUserById(invitation.inviter_id);
    if (inviterUser) {
      const accepterDetails = await db.findUserById(user.userId);
      const { emailService } = await import('@/lib/email-service');
      await emailService.sendInvitationAcceptedNotification(
        inviterUser.email,
        accepterDetails?.name || user.email || 'A user',
        invitation.event_name,
        acceptedInvitation.role
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        event_id: acceptedInvitation.event_id,
        role: acceptedInvitation.role,
        event_name: invitation.event_name,
      },
    });

    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }

    return response;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invitations/[token]/accept
 * Get invitation details without accepting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  try {
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check status
    let status = invitation.status;
    if (new Date(invitation.expires_at) < new Date() && status === 'pending') {
      status = 'expired';
    }

    return NextResponse.json({
      success: true,
      data: {
        event_name: invitation.event_name,
        inviter_name: invitation.inviter_name,
        role: invitation.role,
        status,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitation details' },
      { status: 500 }
    );
  }
}
