// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailService } from '@/lib/email-service';
import { APIResponse } from '@/lib/types';
import { rateLimit } from '@/lib/rate-limiter';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // SECURITY: Apply strict rate limiting (3 requests per 5 minutes)
  const rateLimitResponse = rateLimit(request, 3, 300000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return success
    const user = await db.findUserByEmail(email);
    
    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await db.setPasswordResetToken(email, resetToken, expiresAt);

      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);

      // Log the password reset request
      const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      await db.createAuditLog(user.id, 'password_reset_request', 'success', ipAddress, userAgent);
    }

    // Always return success message (prevents email enumeration)
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
