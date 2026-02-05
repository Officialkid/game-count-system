/**
 * Firestore Cleanup Script
 * 
 * Deletes all documents from Firestore collections while preserving structure.
 * 
 * Usage:
 *   node scripts/cleanup-firestore.js --dry-run          # See what would be deleted
 *   node scripts/cleanup-firestore.js --confirm          # Actually delete data
 *   node scripts/cleanup-firestore.js --confirm --force  # Skip production check
 * 
 * Safety Features:
 * - Requires explicit --confirm flag
 * - Dry-run mode by default
 * - Production environment check
 * - Batch deletion (Firestore limit: 500 ops/batch)
 * - Progress reporting
 * - Error handling
 * 
 * IMPORTANT: Run backup-firestore.js BEFORE running this script!
 */

const admin = require('firebase-admin');
const readline = require('readline');

// ============================================================================
// CONFIGURATION
// ============================================================================

const isDryRun = !process.argv.includes('--confirm');
const isForce = process.argv.includes('--force');
const isProduction = process.env.NODE_ENV === 'production';

const BATCH_SIZE = 500; // Firestore batch limit

// ============================================================================
// INITIALIZE FIREBASE ADMIN
// ============================================================================

let db;

function initializeFirebase() {
  try {
    if (admin.apps.length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      } else {
        console.error('❌ Error: No Firebase credentials found');
        console.error('   Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS');
        process.exit(1);
      }
    }
    
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Prompt user for confirmation
 */
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Get collection statistics
 */
async function getStats() {
  try {
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
      scores: totalScores,
      total: eventsSnapshot.size + totalTeams + totalScores
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return null;
  }
}

// ============================================================================
// DELETION FUNCTIONS
// ============================================================================

/**
 * Delete all scores for a team
 */
async function deleteTeamScores(eventId, teamId) {
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
  
  // Delete in batches
  let batch = db.batch();
  let count = 0;
  let deleted = 0;
  
  for (const doc of snapshot.docs) {
    if (isDryRun) {
      console.log(`   [DRY-RUN] Would delete score: ${doc.id}`);
      deleted++;
    } else {
      batch.delete(doc.ref);
      count++;
      
      // Commit batch when limit reached
      if (count === BATCH_SIZE) {
        await batch.commit();
        deleted += count;
        batch = db.batch();
        count = 0;
      }
    }
  }
  
  // Commit remaining
  if (count > 0 && !isDryRun) {
    await batch.commit();
    deleted += count;
  }
  
  return deleted;
}

/**
 * Delete all teams for an event
 */
async function deleteEventTeams(eventId) {
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
    const scoresDeleted = await deleteTeamScores(eventId, teamDoc.id);
    totalScores += scoresDeleted;
    
    if (scoresDeleted > 0) {
      console.log(`      ├─ Deleted ${scoresDeleted} scores from team: ${teamDoc.id}`);
    }
  }
  
  // Delete teams in batches
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    if (isDryRun) {
      console.log(`   [DRY-RUN] Would delete team: ${doc.id}`);
      totalTeams++;
    } else {
      batch.delete(doc.ref);
      count++;
      
      if (count === BATCH_SIZE) {
        await batch.commit();
        totalTeams += count;
        batch = db.batch();
        count = 0;
      }
    }
  }
  
  if (count > 0 && !isDryRun) {
    await batch.commit();
    totalTeams += count;
  }
  
  return { teams: totalTeams, scores: totalScores };
}

/**
 * Delete all events
 */
async function deleteAllEvents() {
  console.log('\n🗑️  Deleting events...');
  
  const eventsRef = db.collection('events');
  const snapshot = await eventsRef.get();
  
  if (snapshot.empty) {
    console.log('   No events to delete');
    return { events: 0, teams: 0, scores: 0 };
  }
  
  let totalEvents = 0;
  let totalTeams = 0;
  let totalScores = 0;
  
  // Delete subcollections for each event first
  for (const eventDoc of snapshot.docs) {
    const eventData = eventDoc.data();
    console.log(`\n   📦 Processing event: ${eventData.name || eventDoc.id}`);
    
    const { teams, scores } = await deleteEventTeams(eventDoc.id);
    totalTeams += teams;
    totalScores += scores;
    
    if (teams > 0) {
      console.log(`      ✅ Deleted ${teams} teams, ${scores} scores`);
    }
  }
  
  console.log('\n   🗑️  Deleting event documents...');
  
  // Delete events in batches
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    if (isDryRun) {
      console.log(`   [DRY-RUN] Would delete event: ${doc.id}`);
      totalEvents++;
    } else {
      batch.delete(doc.ref);
      count++;
      
      if (count === BATCH_SIZE) {
        await batch.commit();
        totalEvents += count;
        console.log(`      ✅ Deleted ${totalEvents} events so far...`);
        batch = db.batch();
        count = 0;
      }
    }
  }
  
  if (count > 0 && !isDryRun) {
    await batch.commit();
    totalEvents += count;
  }
  
  return {
    events: totalEvents,
    teams: totalTeams,
    scores: totalScores
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🔥 Firestore Cleanup Script');
  console.log('==========================\n');
  
  // Safety checks
  if (isProduction && !isForce) {
    console.error('❌ ERROR: Running in PRODUCTION environment!');
    console.error('   This script will DELETE ALL DATA.');
    console.error('   To proceed, add the --force flag:');
    console.error('   node scripts/cleanup-firestore.js --confirm --force');
    process.exit(1);
  }
  
  if (isDryRun) {
    console.log('🟡 DRY-RUN MODE');
    console.log('   No data will be deleted.');
    console.log('   Use --confirm flag to actually delete data.\n');
  } else {
    console.log('🔴 DELETION MODE');
    console.log('   This will PERMANENTLY DELETE all data!\n');
  }
  
  // Initialize Firebase
  initializeFirebase();
  
  // Get statistics
  console.log('📊 Analyzing database...');
  const stats = await getStats();
  
  if (!stats) {
    console.error('❌ Failed to get database statistics');
    process.exit(1);
  }
  
  console.log('\n📈 Current Database:');
  console.log(`   Events: ${stats.events}`);
  console.log(`   Teams: ${stats.teams}`);
  console.log(`   Scores: ${stats.scores}`);
  console.log(`   ─────────────────────`);
  console.log(`   Total: ${stats.total} documents`);
  
  if (stats.total === 0) {
    console.log('\n✅ Database is already empty. Nothing to clean up.');
    process.exit(0);
  }
  
  // Confirmation
  if (!isDryRun) {
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA!');
    console.log('   Make sure you have a backup!');
    console.log('   Run: node scripts/backup-firestore.js\n');
    
    const confirmed = await promptUser('Type "yes" to confirm deletion: ');
    
    if (!confirmed) {
      console.log('\n❌ Cleanup cancelled.');
      process.exit(0);
    }
    
    console.log('\n🔴 Starting deletion in 3 seconds...');
    console.log('   Press Ctrl+C to cancel!\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Perform cleanup
  const startTime = Date.now();
  
  const deleted = await deleteAllEvents();
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  
  if (isDryRun) {
    console.log('✅ Dry-Run Complete!');
    console.log('\nWould delete:');
  } else {
    console.log('✅ Cleanup Complete!');
    console.log('\nDeleted:');
  }
  
  console.log(`   Events: ${deleted.events}`);
  console.log(`   Teams: ${deleted.teams}`);
  console.log(`   Scores: ${deleted.scores}`);
  console.log(`   ─────────────────────`);
  console.log(`   Total: ${deleted.events + deleted.teams + deleted.scores} documents`);
  console.log(`\n⏱️  Duration: ${duration}s`);
  
  if (isDryRun) {
    console.log('\n💡 To actually delete data, run:');
    console.log('   node scripts/cleanup-firestore.js --confirm');
  } else {
    console.log('\n✅ Database is now empty and ready for production use!');
    console.log('\n💡 To restore from backup, run:');
    console.log('   node scripts/restore-firestore.js <backup-file.json>');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Cleanup cancelled by user.');
  process.exit(0);
});

// Run main function
main().catch(error => {
  console.error('\n❌ Cleanup failed:', error);
  process.exit(1);
});
