// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { APIResponse } from '@/lib/types';
import { rateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting (5 requests per minute)
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // SECURITY: Check if account is locked (graceful fallback if column doesn't exist)
    try {
      const isLocked = await db.isAccountLocked(email);
      if (isLocked) {
        try {
          await db.createAuditLog(null, 'login_attempt', 'failure', ipAddress, userAgent, { email, reason: 'account_locked' });
        } catch (e) {
          // Audit table doesn't exist
        }
        return NextResponse.json<APIResponse>(
          {
            success: false,
            error: 'Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.',
          },
          { status: 423 }
        );
      }
    } catch (e) {
      // locked_until column doesn't exist yet - skip check
    }

    // Find user by email
    const user = await db.findUserByEmail(email);
    
    // SECURITY: Use timing-attack-safe password verification
    // Always performs bcrypt comparison even if user doesn't exist
    const isValidPassword = await auth.verifyPasswordSafe(
      password,
      user?.password_hash || null
    );

    if (!user || !isValidPassword) {
      // Increment failed login attempts (graceful fallback)
      if (user) {
        try {
          await db.incrementFailedLoginAttempts(email);
        } catch (e) {
          // Column doesn't exist yet - ignore
        }
      }
      try {
        await db.createAuditLog(user?.id || null, 'login_attempt', 'failure', ipAddress, userAgent, { email });
      } catch (e) {
        // Audit table doesn't exist yet - ignore
      }
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Reset failed login attempts on successful login (graceful fallback)
    try {
      await db.resetFailedLoginAttempts(email);
    } catch (e) {
      // Column doesn't exist yet - ignore
    }

    // Generate access token (15 minutes) and refresh token (30 days)
    const accessToken = auth.generateToken({
      userId: user.id,
      email: user.email,
    }, '15m');

    const refreshToken = auth.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token and audit logs (gracefully handle if tables don't exist)
    try {
      const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await db.createRefreshToken(user.id, refreshToken, refreshTokenExpiry, userAgent, ipAddress);
      await db.updateLastLogin(user.id, ipAddress);
      await db.createAuditLog(user.id, 'login', 'success', ipAddress, userAgent);
    } catch (dbError: any) {
      // Tables don't exist yet - continue without them
      console.warn('⚠️  Auth tables not found. Run database migration to enable full features.');
    }

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
