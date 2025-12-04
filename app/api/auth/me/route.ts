// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;
    const userData = await db.findUserById(user.userId);

    if (!userData) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Don't send password hash to client
    const { password_hash, ...safeUserData } = userData;

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          user: safeUserData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Failed to fetch user data',
      },
      { status: 500 }
    );
  }
}
