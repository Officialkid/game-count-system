// app/api/user/tutorial/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.authenticated) return authResult.error;
  const { user, newToken } = authResult;

  const status = await db.getOnboardingStatus(user.userId);
  
  const response = NextResponse.json({ success: true, data: status }, { status: 200 });
  if (newToken) {
    response.headers.set('X-Refreshed-Token', newToken);
  }
  return response;
}

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (!authResult.authenticated) return authResult.error;
  const { user, newToken } = authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const completed = Boolean(body.completed);
    const step = typeof body.step === 'number' && body.step >= 0 ? Math.floor(body.step) : 0;

    const result = await db.updateOnboardingStatus(user.userId, completed, step);
    
    const response = NextResponse.json({ success: true, data: result }, { status: 200 });
    if (newToken) {
      response.headers.set('X-Refreshed-Token', newToken);
    }
    return response;
  } catch (error) {
    console.error('Onboarding update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update onboarding status' }, { status: 500 });
  }
}
