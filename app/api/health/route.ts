// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        firebase: 'ready', // Will be updated when Firebase is configured
      },
      version: '3.0.0',
      environment: process.env.NODE_ENV,
      database: 'Firebase Firestore (pending setup)',
    };

    return NextResponse.json(health, { 
      status: 200,
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

