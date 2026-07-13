import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/server/prisma';

type CleanupCollection = 'events' | 'teams' | 'scores';

interface CleanupRequest {
  adminSecret: string;
  dryRun?: boolean;
  collections?: CleanupCollection[];
}

const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function validateAdminSecret(secret: string | undefined): boolean {
  return Boolean(ADMIN_SECRET && secret && secret === ADMIN_SECRET);
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

function parseRequestBody(body: unknown): { valid: boolean; data?: CleanupRequest; error?: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Invalid request body' };
  const input = body as Record<string, unknown>;
  const adminSecret = input.adminSecret;
  const dryRun = input.dryRun ?? false;
  const collections = input.collections ?? ['events', 'teams', 'scores'];

  if (typeof adminSecret !== 'string' || adminSecret.trim().length === 0) return { valid: false, error: 'Missing or invalid adminSecret' };
  if (typeof dryRun !== 'boolean') return { valid: false, error: 'dryRun must be a boolean' };
  if (!Array.isArray(collections)) return { valid: false, error: 'collections must be an array' };

  const validCollections: CleanupCollection[] = ['events', 'teams', 'scores'];
  const invalidCollections = collections.filter((value): value is unknown => !validCollections.includes(value as CleanupCollection));
  if (invalidCollections.length > 0) return { valid: false, error: `Invalid collections: ${invalidCollections.join(', ')}` };

  return { valid: true, data: { adminSecret, dryRun, collections: collections as CleanupCollection[] } };
}

async function getDatabaseStats() {
  const [events, teams, scores] = await prisma.$transaction([prisma.event.count(), prisma.team.count(), prisma.score.count()]);
  return { events, teams, scores, total: events + teams + scores };
}

async function performCleanup(collections: CleanupCollection[], dryRun: boolean) {
  const before = await getDatabaseStats();
  const uniqueCollections = Array.from(new Set(collections));

  if (dryRun) {
    return {
      deleted: {
        events: uniqueCollections.includes('events') ? before.events : 0,
        teams: uniqueCollections.includes('events') ? 0 : uniqueCollections.includes('teams') ? before.teams : 0,
        scores: uniqueCollections.includes('events') || uniqueCollections.includes('teams') ? 0 : uniqueCollections.includes('scores') ? before.scores : 0,
      },
      before,
      after: before,
    };
  }

  if (uniqueCollections.includes('events')) {
    await prisma.event.deleteMany();
  } else {
    if (uniqueCollections.includes('scores')) await prisma.score.deleteMany();
    if (uniqueCollections.includes('teams')) await prisma.team.deleteMany();
  }

  const after = await getDatabaseStats();
  return { deleted: { events: before.events - after.events, teams: before.teams - after.teams, scores: before.scores - after.scores }, before, after };
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const parsed = parseRequestBody(await request.json());
    if (!parsed.valid || !parsed.data) return NextResponse.json({ success: false, error: parsed.error ?? 'Invalid request', timestamp: new Date().toISOString() }, { status: 400 });
    if (!validateAdminSecret(parsed.data.adminSecret)) return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin secret', timestamp: new Date().toISOString() }, { status: 401 });
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again later.', timestamp: new Date().toISOString() }, { status: 429 });

    const result = await performCleanup(parsed.data.collections ?? ['events', 'teams', 'scores'], parsed.data.dryRun ?? false);
    return NextResponse.json({ success: true, deleted: result.deleted, stats: { before: result.before, after: result.after }, dryRun: parsed.data.dryRun ?? false, timestamp: new Date().toISOString(), duration: Date.now() - startedAt, backend: 'Prisma + Neon Postgres' });
  } catch (error) {
    console.error('Admin cleanup failed:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error', timestamp: new Date().toISOString(), duration: Date.now() - startedAt }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.nextUrl.searchParams.get('adminSecret') || request.headers.get('x-admin-secret') || undefined;
    if (!validateAdminSecret(adminSecret)) return NextResponse.json({ success: false, error: 'Unauthorized: Invalid admin secret', timestamp: new Date().toISOString() }, { status: 401 });
    const stats = await getDatabaseStats();
    return NextResponse.json({ success: true, stats, backend: 'Prisma + Neon Postgres', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to get cleanup stats:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Internal server error', timestamp: new Date().toISOString() }, { status: 500 });
  }
}
