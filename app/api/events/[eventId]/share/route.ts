// app/api/events/[eventId]/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { APIResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
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
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Unauthorized to create share link for this event',
        },
        { status: 403 }
      );
    }

    // Check if share link already exists
    const existingLink = await db.getShareLinkByEventId(eventId);
    
    if (existingLink) {
      return NextResponse.json<APIResponse>(
        {
          success: true,
          data: {
            share_link: existingLink,
            public_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/public/${existingLink.token}`,
          },
        },
        { status: 200 }
      );
    }

    // Generate new share token
    const shareToken = nanoid(16);
    const shareLink = await db.createShareLink(eventId, shareToken);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          share_link: shareLink,
          public_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/public/${shareToken}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to create share link',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
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
        {
          success: false,
          error: 'Event not found',
        },
        { status: 404 }
      );
    }

    if (event.user_id !== user.userId) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Unauthorized to delete share link for this event',
        },
        { status: 403 }
      );
    }

    await db.deleteShareLink(eventId);

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: { message: 'Share link deleted successfully' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete share link error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to delete share link',
      },
      { status: 500 }
    );
  }
}
