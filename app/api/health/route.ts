// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite';

export async function GET() {
  const startTime = Date.now();

  try {
    // Check Appwrite database connectivity
    const dbCheck = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      'events',
      []
    ).catch(() => null);

    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbCheck !== null ? 'connected' : 'disconnected',
        appwrite: dbCheck !== null ? 'operational' : 'degraded',
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(health, { status: 200 });
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
