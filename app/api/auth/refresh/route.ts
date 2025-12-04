// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { APIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Refresh token is required',
        },
        { status: 400 }
      );
    }

    // Find and validate refresh token
    const tokenData = await db.findRefreshToken(refresh_token);
    
    if (!tokenData) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Invalid or expired refresh token',
        },
        { status: 401 }
      );
    }

    // Get user data
    const user = await db.findUserById(tokenData.user_id);
    
    if (!user) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Update last used timestamp
    await db.updateRefreshTokenUsage(tokenData.id);

    // Generate new access token (short-lived)
    const accessToken = auth.generateToken({
      userId: user.id,
      email: user.email,
    }, '15m');

    // Log successful token refresh
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await db.createAuditLog(
      user.id,
      'token_refresh',
      'success',
      ipAddress,
      userAgent
    );

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
