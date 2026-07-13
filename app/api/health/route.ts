import { NextResponse } from 'next/server';
import prisma from '@/lib/server/prisma';

export async function GET() {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${Date.now() - startTime}ms`,
      services: { database: 'ready', prisma: 'ready' },
      version: '3.0.0',
      environment: process.env.NODE_ENV,
      database: 'Neon Postgres via Prisma',
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', timestamp: new Date().toISOString(), responseTime: `${Date.now() - startTime}ms`, error: error instanceof Error ? error.message : 'Unknown error', database: 'Neon Postgres via Prisma' }, { status: 503 });
  }
}
