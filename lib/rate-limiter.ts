// lib/rate-limiter.ts
import { NextRequest, NextResponse } from 'next/server';
import { APIErrorCode } from './errors';

const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return null; // Allow
  }

  if (limit.count >= maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: APIErrorCode.RATE_LIMITED,
          message: 'Too many requests. Please try again later.',
        },
      },
      { status: 429 }
    );
  }

  limit.count++;
  return null; // Allow
}
