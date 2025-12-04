import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📥 GET /api/events/[eventId]/share-link - eventId:', params.eventId);
    
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      console.log('❌ Unauthorized');
      return authResult.error;
    }

    const { user } = authResult;
    const eventId = params.eventId;

    // Verify event ownership
    const event = await db.getEventById(eventId);
    if (!event) {
      console.log('❌ Event not found');
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      console.log('❌ Unauthorized - not event owner');
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get existing share link; if missing, create one so verification works
    let shareLink = await db.getShareLinkByEvent(eventId);
    if (!shareLink) {
      const token = require('crypto').randomBytes(12).toString('base64url');
      shareLink = await db.createShareLink(eventId, token);
      console.log('🆕 Share link created on GET:', shareLink);
    } else {
      console.log('✅ Share link found:', shareLink);
    }

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          shareLink: shareLink ? {
            share_token: shareLink.token,
            is_active: true,
            created_at: shareLink.created_at
          } : null
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error getting share link:', error);
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Failed to get share link' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📥 POST /api/events/[eventId]/share-link - eventId:', params.eventId);
    
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;
    const eventId = params.eventId;

    // Verify event ownership
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete old share link if exists
    await db.deleteShareLink(eventId);

    // Generate new token (16 chars, URL-safe)
    const token = require('crypto').randomBytes(12).toString('base64url');
    console.log('🔑 Generated new token:', token);

    // Create new share link
    const shareLink = await db.createShareLink(eventId, token);
    console.log('✅ Share link created:', shareLink);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          shareLink: {
            share_token: shareLink.token,
            is_active: true,
            created_at: shareLink.created_at
          }
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error regenerating share link:', error);
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Failed to regenerate share link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('📥 DELETE /api/events/[eventId]/share-link - eventId:', params.eventId);
    
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;
    const eventId = params.eventId;

    // Verify event ownership
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      return NextResponse.json<APIResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete share link
    await db.deleteShareLink(eventId);
    console.log('✅ Share link deleted');

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: { message: 'Share link deleted successfully' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting share link:', error);
    return NextResponse.json<APIResponse>(
      { success: false, error: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}
