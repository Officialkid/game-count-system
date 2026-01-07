// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db-client';
import { handleCors } from '@/lib/cors';

export async function GET(request: Request) {
  // Handle CORS
  const corsHeaders = handleCors(request);
  if (request.method === 'OPTIONS') {
    return corsHeaders;
  }

  const startTime = Date.now();

  try {
    // Check PostgreSQL database connectivity
    const dbCheck = await query('SELECT NOW() as current_time').catch(() => null);

    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbCheck !== null ? 'connected' : 'disconnected',
        postgresql: dbCheck !== null ? 'operational' : 'degraded',
      },
      version: '2.0.0',
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(health, { 
      status: 200,
      headers: corsHeaders as HeadersInit
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
