// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { APIResponse } from '@/lib/types';
import { rateLimit } from '@/lib/rate-limiter';
import { validatePassword } from '@/lib/password-validator';

export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting (5 requests per minute)
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // SECURITY: Validate password strength
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

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Email already registered',
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await auth.hashPassword(password);

    // Create user
    const user = await db.createUser(name, email, passwordHash);

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate access token (15 minutes) and refresh token (30 days)
    const accessToken = auth.generateToken({
      userId: user.id,
      email: user.email,
    }, '15m');

    const refreshToken = auth.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token in database (gracefully handle if table doesn't exist)
    try {
      const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await db.createRefreshToken(user.id, refreshToken, refreshTokenExpiry, userAgent, ipAddress);
      
      // Log successful registration
      await db.createAuditLog(user.id, 'register', 'success', ipAddress, userAgent);
    } catch (dbError: any) {
      // Tables don't exist yet - continue without them
      console.warn('⚠️  Auth tables not found. Run database migration to enable full features.');
      console.warn('   Migration: migrations/2025-12-03-auth-enhancements.sql');
    }

    // TODO: Send verification email
    // const verificationToken = crypto.randomBytes(32).toString('hex');
    // await db.setVerificationToken(user.id, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000));
    // await emailService.sendVerificationEmail(email, verificationToken);

    return NextResponse.json<APIResponse>(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
