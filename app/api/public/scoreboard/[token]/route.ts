// app/api/public/scoreboard/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { APIResponse } from '@/lib/types';
import { publicScoreboardCache, withCache } from '@/lib/cache';

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
      return rateLimitResponse(rateLimit.resetTime!, 'Too many requests to scoreboard');
    }

    const token = params.token;
    console.log('📥 GET /api/public/scoreboard/[token] - Received token:', token);
    
    if (!token) {
      console.log('❌ Missing token');
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Use shared cached lookup to unify response format
    const data = await withCache(publicScoreboardCache, `public:${token}`, async () => {
      const link = await db.findShareLinkByToken(token);
      console.log('🔍 Share link query result:', link);
      if (!link) {
        console.log('❌ Share link not found for token:', token);
        return null;
      }

      const eventId = link.event_id.toString();
      console.log('📊 Fetching event, teams, scores for event_id:', eventId);
      const scoreboard = await db.getPublicScoreboard(eventId);
      return scoreboard;
    }, 10000);

    if (!data || !data.event) {
      return NextResponse.json<APIResponse>({ success: false, error: 'Invalid or expired link' }, { status: 404 });
    }

    // Skip audit logging for public endpoint to avoid FK issues

    return NextResponse.json<APIResponse>({
      success: true,
      data: {
        event: {
          id: data.event.id,
          event_name: data.event.event_name,
          theme_color: data.event.theme_color,
          logo_url: data.event.logo_url,
          created_at: data.event.created_at,
        },
        teams: data.teams,
        scores: data.scores,
      },
    });
  } catch (error) {
    console.error('Error loading public scoreboard:', error);
    return NextResponse.json({ error: 'Failed to load scoreboard' }, { status: 500 });
  }
}
