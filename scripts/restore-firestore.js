/**
 * Firestore Restore Script
 * 
 * Restores data from a backup JSON file created by backup-firestore.js
 * 
 * Usage:
 *   node scripts/restore-firestore.js <backup-file.json>
 *   node scripts/restore-firestore.js backups/firestore-complete-2026-02-05.json
 *   node scripts/restore-firestore.js backups/firestore-complete-2026-02-05.json --dry-run
 * 
 * Features:
 * - Restores events with nested teams and scores
 * - Preserves document IDs
 * - Converts ISO timestamps back to Firestore Timestamps
 * - Shows progress during restore
 * - Validates backup file structure
 * - Batch writes (500 ops/batch limit)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const backupFile = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');

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
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate backup file exists and is readable
 */
function validateBackupFile(filepath) {
  if (!filepath) {
    console.error('❌ Error: No backup file specified');
    console.error('   Usage: node scripts/restore-firestore.js <backup-file.json>');
    process.exit(1);
  }
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Error: Backup file not found: ${filepath}`);
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('Backup file must contain an array of events');
    }
    
    console.log(`✅ Backup file validated: ${filepath}`);
    return data;
  } catch (error) {
    console.error('❌ Error reading backup file:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// RESTORE FUNCTIONS
// ============================================================================

/**
 * Convert ISO timestamp string to Firestore Timestamp
 */
function toTimestamp(isoString) {
  if (!isoString) return null;
  
  try {
    const date = new Date(isoString);
    return admin.firestore.Timestamp.fromDate(date);
  } catch (error) {
    console.warn(`⚠️  Failed to convert timestamp: ${isoString}`);
    return null;
  }
}

/**
 * Prepare event data for Firestore
 */
function prepareEventData(event) {
  const data = { ...event };
  
  // Remove teams array (will be restored separately)
  delete data.teams;
  delete data.id;
  
  // Convert timestamps
  if (data.createdAt) data.createdAt = toTimestamp(data.createdAt);
  if (data.updatedAt) data.updatedAt = toTimestamp(data.updatedAt);
  if (data.expiresAt) data.expiresAt = toTimestamp(data.expiresAt);
  if (data.autoCleanupDate) data.autoCleanupDate = toTimestamp(data.autoCleanupDate);
  
  return data;
}

/**
 * Prepare team data for Firestore
 */
function prepareTeamData(team) {
  const data = { ...team };
  
  // Remove scores array (will be restored separately)
  delete data.scores;
  delete data.id;
  
  // Convert timestamps
  if (data.createdAt) data.createdAt = toTimestamp(data.createdAt);
  if (data.updatedAt) data.updatedAt = toTimestamp(data.updatedAt);
  
  return data;
}

/**
 * Prepare score data for Firestore
 */
function prepareScoreData(score) {
  const data = { ...score };
  
  delete data.id;
  
  // Convert timestamps
  if (data.createdAt) data.createdAt = toTimestamp(data.createdAt);
  if (data.updatedAt) data.updatedAt = toTimestamp(data.updatedAt);
  
  return data;
}

/**
 * Restore scores for a team
 */
async function restoreTeamScores(eventId, teamId, scores) {
  if (!scores || scores.length === 0) {
    return 0;
  }
  
  let batch = db.batch();
  let count = 0;
  let restored = 0;
  
  for (const score of scores) {
    const scoreRef = db
      .collection('events')
      .doc(eventId)
      .collection('teams')
      .doc(teamId)
      .collection('scores')
      .doc(score.id);
    
    if (isDryRun) {
      console.log(`      [DRY-RUN] Would restore score: ${score.id}`);
      restored++;
    } else {
      const scoreData = prepareScoreData(score);
      batch.set(scoreRef, scoreData);
      count++;
      
      // Commit batch when limit reached
      if (count === BATCH_SIZE) {
        await batch.commit();
        restored += count;
        batch = db.batch();
        count = 0;
      }
    }
  }
  
  // Commit remaining
  if (count > 0 && !isDryRun) {
    await batch.commit();
    restored += count;
  }
  
  return restored;
}

/**
 * Restore teams for an event
 */
async function restoreEventTeams(eventId, teams) {
  if (!teams || teams.length === 0) {
    return { teams: 0, scores: 0 };
  }
  
  let totalTeams = 0;
  let totalScores = 0;
  
  // Restore team documents
  let batch = db.batch();
  let count = 0;
  
  for (const team of teams) {
    const teamRef = db
      .collection('events')
      .doc(eventId)
      .collection('teams')
      .doc(team.id);
    
    if (isDryRun) {
      console.log(`   [DRY-RUN] Would restore team: ${team.name || team.id}`);
      totalTeams++;
    } else {
      const teamData = prepareTeamData(team);
      batch.set(teamRef, teamData);
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
  
  // Restore scores for each team
  for (const team of teams) {
    const scoresRestored = await restoreTeamScores(eventId, team.id, team.scores);
    totalScores += scoresRestored;
    
    if (scoresRestored > 0) {
      console.log(`      ├─ Restored ${scoresRestored} scores for team: ${team.name || team.id}`);
    }
  }
  
  return { teams: totalTeams, scores: totalScores };
}

/**
 * Restore all events
 */
async function restoreAllEvents(events) {
  console.log('\n📦 Restoring events...');
  
  let totalEvents = 0;
  let totalTeams = 0;
  let totalScores = 0;
  
  // Restore event documents
  let batch = db.batch();
  let count = 0;
  
  for (const event of events) {
    const eventRef = db.collection('events').doc(event.id);
    
    if (isDryRun) {
      console.log(`\n   [DRY-RUN] Would restore event: ${event.name || event.id}`);
      totalEvents++;
    } else {
      const eventData = prepareEventData(event);
      batch.set(eventRef, eventData);
      count++;
      
      if (count === BATCH_SIZE) {
        await batch.commit();
        totalEvents += count;
        batch = db.batch();
        count = 0;
      }
    }
  }
  
  if (count > 0 && !isDryRun) {
    await batch.commit();
    totalEvents += count;
  }
  
  console.log(`\n   ✅ ${isDryRun ? 'Would restore' : 'Restored'} ${totalEvents} events`);
  
  // Restore subcollections
  console.log('\n📦 Restoring teams and scores...');
  
  for (const event of events) {
    console.log(`\n   📦 Processing event: ${event.name || event.id}`);
    
    const { teams, scores } = await restoreEventTeams(event.id, event.teams);
    totalTeams += teams;
    totalScores += scores;
    
    if (teams > 0) {
      console.log(`      ✅ ${isDryRun ? 'Would restore' : 'Restored'} ${teams} teams, ${scores} scores`);
    }
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
  console.log('🔥 Firestore Restore Script');
  console.log('==========================\n');
  
  if (isDryRun) {
    console.log('🟡 DRY-RUN MODE');
    console.log('   No data will be written.\n');
  } else {
    console.log('🟢 RESTORE MODE');
    console.log('   Data will be written to Firestore.\n');
  }
  
  // Validate backup file
  console.log('📄 Validating backup file...');
  const events = validateBackupFile(backupFile);
  
  console.log(`\n📊 Backup contains:`);
  console.log(`   Events: ${events.length}`);
  
  let totalTeams = 0;
  let totalScores = 0;
  events.forEach(event => {
    if (event.teams) {
      totalTeams += event.teams.length;
      event.teams.forEach(team => {
        if (team.scores) {
          totalScores += team.scores.length;
        }
      });
    }
  });
  
  console.log(`   Teams: ${totalTeams}`);
  console.log(`   Scores: ${totalScores}`);
  console.log(`   ─────────────────────`);
  console.log(`   Total: ${events.length + totalTeams + totalScores} documents`);
  
  if (events.length === 0) {
    console.log('\n⚠️  Backup file is empty. Nothing to restore.');
    process.exit(0);
  }
  
  // Initialize Firebase
  initializeFirebase();
  
  // Warn about existing data
  if (!isDryRun) {
    console.log('\n⚠️  WARNING: This will OVERWRITE existing data!');
    console.log('   Documents with the same IDs will be replaced.');
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Perform restore
  const startTime = Date.now();
  
  const restored = await restoreAllEvents(events);
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  
  if (isDryRun) {
    console.log('✅ Dry-Run Complete!');
    console.log('\nWould restore:');
  } else {
    console.log('✅ Restore Complete!');
    console.log('\nRestored:');
  }
  
  console.log(`   Events: ${restored.events}`);
  console.log(`   Teams: ${restored.teams}`);
  console.log(`   Scores: ${restored.scores}`);
  console.log(`   ─────────────────────`);
  console.log(`   Total: ${restored.events + restored.teams + restored.scores} documents`);
  console.log(`\n⏱️  Duration: ${duration}s`);
  
  if (isDryRun) {
    console.log('\n💡 To actually restore data, run without --dry-run:');
    console.log(`   node scripts/restore-firestore.js ${backupFile}`);
  } else {
    console.log('\n✅ Data successfully restored to Firestore!');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Restore cancelled by user.');
  process.exit(0);
});

// Run main function
main().catch(error => {
  console.error('\n❌ Restore failed:', error);
  process.exit(1);
});
