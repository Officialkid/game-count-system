// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { validatePassword } from '@/lib/password-validator';
import { APIResponse } from '@/lib/types';
import { rateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Token and password are required',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: passwordValidation.errors.join('. '),
        },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await db.findUserByResetToken(token);
    
    if (!user) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await auth.hashPassword(password);

    // Update password
    await db.resetPassword(user.id, passwordHash);

    // Revoke all existing refresh tokens for security
    await db.revokeAllUserRefreshTokens(user.id);

    // Log password change
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    await db.createAuditLog(user.id, 'password_reset', 'success', ipAddress, userAgent);

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: 'Password has been reset successfully',
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
