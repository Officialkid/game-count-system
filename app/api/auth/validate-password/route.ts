// app/api/auth/validate-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password-validator';
import { APIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Password is required',
        },
        { status: 400 }
      );
    }

    const validation = validatePassword(password);

    return NextResponse.json<APIResponse>({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Password validation error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
