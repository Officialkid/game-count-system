// app/api/public/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { APIResponse } from '@/lib/types';
import { publicScoreboardCache, withCache } from '@/lib/cache';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Rate limiting: 60 requests per minute
    const rateLimit = checkRateLimit(request, {
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetTime!, 'Too many requests to public scoreboard');
    }

    const { token } = params;
    console.log('📥 GET /api/public/[token] - Received token:', token);

    if (!token || typeof token !== 'string') {
      console.log('❌ Invalid token format');
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Invalid token',
        },
        { status: 400 }
      );
    }

    // Use cache for public scoreboard
    const scoreboardData = await withCache(
      publicScoreboardCache,
      `public:${token}`,
      async () => {
        // Find share link by token
        const shareLink = await db.findShareLinkByToken(token);
        console.log('🔍 Share link query result:', shareLink);
        
        if (!shareLink) {
          console.log('❌ Share link not found for token:', token);
          return null;
        }

        // Get public scoreboard data
        console.log('📊 Fetching scoreboard for event_id:', shareLink.event_id);
        const scoreboard = await db.getPublicScoreboard(shareLink.event_id);
        console.log('✅ Scoreboard data:', { 
          event: scoreboard.event?.event_name, 
          teams: scoreboard.teams?.length,
          scores: scoreboard.scores?.length  
        });

        return scoreboard;
      },
      10000 // 10 seconds cache for real-time updates
    );

    if (!scoreboardData || !scoreboardData.event) {
      console.log('❌ Scoreboard data not found');
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Invalid or expired share link',
        },
        { status: 404 }
      );
    }

    const scoreboard = scoreboardData;

    console.log('✅ Returning public scoreboard data');
    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        event: {
          id: scoreboard.event.id,
          event_name: scoreboard.event.event_name,
          created_at: scoreboard.event.created_at,
          theme_color: scoreboard.event.theme_color,
          logo_url: scoreboard.event.logo_url,
        },
        teams: scoreboard.teams,
        scores: scoreboard.scores,
      },
    });
  } catch (error) {
    console.error('Get public scoreboard error:', error);
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
