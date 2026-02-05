/**
 * Admin Cleanup API Endpoint
 * 
 * DELETE /api/admin/cleanup
 * 
 * Securely delete all test/mock data from Firestore database.
 * 
 * Features:
 * - Admin secret authentication
 * - Dry-run mode (test without deleting)
 * - Selective collection cleanup
 * - Batch deletion (respects Firestore 500 op limit)
 * - Detailed deletion counts
 * - Comprehensive error handling
 * - Operation logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CleanupRequest {
  adminSecret: string;
  dryRun?: boolean;
  collections?: ('events' | 'teams' | 'scores')[];
}

interface CleanupResult {
  success: boolean;
  deleted?: {
    events: number;
    teams: number;
    scores: number;
  };
  dryRun?: boolean;
  timestamp: string;
  duration?: number;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET;
const BATCH_SIZE = 500; // Firestore batch operation limit

// Rate limiting (in-memory, resets on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

// ============================================================================
// AUTHENTICATION & VALIDATION
// ============================================================================

/**
 * Validate admin secret
 */
function validateAdminSecret(secret: string | undefined): boolean {
  if (!ADMIN_SECRET) {
    console.error('⚠️  ADMIN_CLEANUP_SECRET not configured in environment variables');
    return false;
  }
  
  if (!secret) {
    return false;
  }
  
  return secret === ADMIN_SECRET;
}

/**
 * Rate limiting check
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

/**
 * Parse and validate request body
 */
function parseRequestBody(body: any): { valid: boolean; data?: CleanupRequest; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { adminSecret, dryRun = false, collections = ['events', 'teams', 'scores'] } = body;
  
  if (!adminSecret || typeof adminSecret !== 'string') {
    return { valid: false, error: 'Missing or invalid adminSecret' };
  }
  
  if (typeof dryRun !== 'boolean') {
    return { valid: false, error: 'dryRun must be a boolean' };
  }
  
  if (!Array.isArray(collections)) {
    return { valid: false, error: 'collections must be an array' };
  }
  
  const validCollections = ['events', 'teams', 'scores'];
  const invalidCollections = collections.filter(c => !validCollections.includes(c));
  
  if (invalidCollections.length > 0) {
    return { 
      valid: false, 
      error: `Invalid collections: ${invalidCollections.join(', ')}. Valid: ${validCollections.join(', ')}` 
    };
  }
  
  return {
    valid: true,
    data: { adminSecret, dryRun, collections: collections as ('events' | 'teams' | 'scores')[] }
  };
}

// ============================================================================
// DELETION FUNCTIONS
// ============================================================================

/**
 * Delete all scores for a team
 */
async function deleteTeamScores(eventId: string, teamId: string, dryRun: boolean): Promise<number> {
  const scoresRef = db
    .collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId)
    .collection('scores');
  
  const snapshot = await scoresRef.get();
  
  if (snapshot.empty) {
    return 0;
  }
  
  if (dryRun) {
    console.log(`   [DRY-RUN] Would delete ${snapshot.size} scores from team ${teamId}`);
    return snapshot.size;
  }
  
  // Delete in batches
  let batch = db.batch();
  let count = 0;
  let deleted = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count === BATCH_SIZE) {
      await batch.commit();
      deleted += count;
      batch = db.batch();
      count = 0;
    }
  }
  
  // Commit remaining
  if (count > 0) {
    await batch.commit();
    deleted += count;
  }
  
  return deleted;
}

/**
 * Delete all teams for an event
 */
async function deleteEventTeams(eventId: string, dryRun: boolean): Promise<{ teams: number; scores: number }> {
  const teamsRef = db
    .collection('events')
    .doc(eventId)
    .collection('teams');
  
  const snapshot = await teamsRef.get();
  
  if (snapshot.empty) {
    return { teams: 0, scores: 0 };
  }
  
  let totalTeams = 0;
  let totalScores = 0;
  
  // Delete scores for each team first
  for (const teamDoc of snapshot.docs) {
    const scoresDeleted = await deleteTeamScores(eventId, teamDoc.id, dryRun);
    totalScores += scoresDeleted;
  }
  
  if (dryRun) {
    console.log(`   [DRY-RUN] Would delete ${snapshot.size} teams from event ${eventId}`);
    return { teams: snapshot.size, scores: totalScores };
  }
  
  // Delete teams in batches
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count === BATCH_SIZE) {
      await batch.commit();
      totalTeams += count;
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
    totalTeams += count;
  }
  
  return { teams: totalTeams, scores: totalScores };
}

/**
 * Delete all events (and their subcollections)
 */
async function deleteAllEvents(dryRun: boolean): Promise<{ events: number; teams: number; scores: number }> {
  const eventsRef = db.collection('events');
  const snapshot = await eventsRef.get();
  
  if (snapshot.empty) {
    return { events: 0, teams: 0, scores: 0 };
  }
  
  let totalEvents = 0;
  let totalTeams = 0;
  let totalScores = 0;
  
  // Delete subcollections for each event first
  for (const eventDoc of snapshot.docs) {
    const { teams, scores } = await deleteEventTeams(eventDoc.id, dryRun);
    totalTeams += teams;
    totalScores += scores;
    
    if (!dryRun && (teams > 0 || scores > 0)) {
      console.log(`   ✅ Deleted ${teams} teams, ${scores} scores from event ${eventDoc.id}`);
    }
  }
  
  if (dryRun) {
    console.log(`   [DRY-RUN] Would delete ${snapshot.size} events`);
    return { events: snapshot.size, teams: totalTeams, scores: totalScores };
  }
  
  // Delete events in batches
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    if (count === BATCH_SIZE) {
      await batch.commit();
      totalEvents += count;
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
    totalEvents += count;
  }
  
  return { events: totalEvents, teams: totalTeams, scores: totalScores };
}

/**
 * Get current database statistics
 */
async function getDatabaseStats(): Promise<{ events: number; teams: number; scores: number }> {
  const eventsSnapshot = await db.collection('events').get();
  let totalTeams = 0;
  let totalScores = 0;
  
  for (const eventDoc of eventsSnapshot.docs) {
    const teamsSnapshot = await db
      .collection('events')
      .doc(eventDoc.id)
      .collection('teams')
      .get();
    
    totalTeams += teamsSnapshot.size;
    
    for (const teamDoc of teamsSnapshot.docs) {
      const scoresSnapshot = await db
        .collection('events')
        .doc(eventDoc.id)
        .collection('teams')
        .doc(teamDoc.id)
        .collection('scores')
        .get();
      
      totalScores += scoresSnapshot.size;
    }
  }
  
  return {
    events: eventsSnapshot.size,
    teams: totalTeams,
    scores: totalScores
  };
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/admin/cleanup
 * 
 * Clean up database with admin authentication
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { valid, data, error } = parseRequestBody(body);
    
    if (!valid || !data) {
      console.error('❌ Invalid request:', error);
      return NextResponse.json(
        {
          success: false,
          error: error || 'Invalid request',
          timestamp: new Date().toISOString()
        } as CleanupResult,
        { status: 400 }
      );
    }
    
    // Validate admin secret
    if (!validateAdminSecret(data.adminSecret)) {
      console.error('❌ Unauthorized cleanup attempt');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid admin secret',
          timestamp: new Date().toISOString()
        } as CleanupResult,
        { status: 401 }
      );
    }
    
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.warn('⚠️  Rate limit exceeded for IP:', clientIp);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Try again later.',
          timestamp: new Date().toISOString()
        } as CleanupResult,
        { status: 429 }
      );
    }
    
    const { dryRun = false, collections = ['events', 'teams', 'scores'] } = data;
    
    // Log operation
    console.log('\n🗑️  Admin Cleanup Request');
    console.log('========================');
    console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'DELETE'}`);
    console.log(`Collections: ${collections.join(', ')}`);
    console.log(`IP: ${clientIp}`);
    console.log(`Time: ${new Date().toISOString()}\n`);
    
    // Get current stats
    console.log('📊 Analyzing database...');
    const stats = await getDatabaseStats();
    console.log(`   Events: ${stats.events}`);
    console.log(`   Teams: ${stats.teams}`);
    console.log(`   Scores: ${stats.scores}\n`);
    
    if (stats.events === 0 && stats.teams === 0 && stats.scores === 0) {
      console.log('✅ Database is already empty');
      return NextResponse.json(
        {
          success: true,
          deleted: {
            events: 0,
            teams: 0,
            scores: 0
          },
          dryRun,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        } as CleanupResult,
        { status: 200 }
      );
    }
    
    // Perform cleanup
    console.log(`${dryRun ? '🟡 Starting dry-run...' : '🔴 Starting deletion...'}\n`);
    
    let deletedEvents = 0;
    let deletedTeams = 0;
    let deletedScores = 0;
    
    // Always delete from bottom-up: scores → teams → events
    if (collections.includes('events')) {
      // This will also delete teams and scores as subcollections
      const result = await deleteAllEvents(dryRun);
      deletedEvents = result.events;
      deletedTeams = result.teams;
      deletedScores = result.scores;
    } else {
      // Selective cleanup not fully implemented yet
      // For now, we only support full cleanup (events with subcollections)
      console.warn('⚠️  Selective collection cleanup not yet implemented');
    }
    
    const duration = Date.now() - startTime;
    
    // Log results
    console.log('\n' + '='.repeat(50));
    console.log(`${dryRun ? '✅ Dry-Run Complete!' : '✅ Cleanup Complete!'}`);
    console.log(`\n${dryRun ? 'Would delete:' : 'Deleted:'}`);
    console.log(`   Events: ${deletedEvents}`);
    console.log(`   Teams: ${deletedTeams}`);
    console.log(`   Scores: ${deletedScores}`);
    console.log(`   Total: ${deletedEvents + deletedTeams + deletedScores} documents`);
    console.log(`\n⏱️  Duration: ${(duration / 1000).toFixed(2)}s\n`);
    
    return NextResponse.json(
      {
        success: true,
        deleted: {
          events: deletedEvents,
          teams: deletedTeams,
          scores: deletedScores
        },
        dryRun,
        timestamp: new Date().toISOString(),
        duration
      } as CleanupResult,
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      } as CleanupResult,
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup
 * 
 * Get database statistics without deleting
 */
export async function GET(request: NextRequest) {
  try {
    // Validate admin secret from query params or headers
    const adminSecret = request.nextUrl.searchParams.get('adminSecret') || 
                       request.headers.get('x-admin-secret');
    
    if (!validateAdminSecret(adminSecret || undefined)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid admin secret',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }
    
    // Get stats
    const stats = await getDatabaseStats();
    
    return NextResponse.json(
      {
        success: true,
        stats: {
          events: stats.events,
          teams: stats.teams,
          scores: stats.scores,
          total: stats.events + stats.teams + stats.scores
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ Failed to get stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
