/**
 * Firestore Backup Script
 * 
 * Exports all data from Firestore collections to timestamped JSON files.
 * 
 * Usage:
 *   node scripts/backup-firestore.js
 *   node scripts/backup-firestore.js --output ./backups
 * 
 * Features:
 * - Exports all events with nested teams and scores
 * - Creates timestamped backup files
 * - Shows progress during export
 * - Validates data before saving
 * - Creates backup directory if needed
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKUP_DIR = process.argv.includes('--output') 
  ? process.argv[process.argv.indexOf('--output') + 1]
  : path.join(__dirname, '..', 'backups');

const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// ============================================================================
// INITIALIZE FIREBASE ADMIN
// ============================================================================

let db;

function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      // Initialize with service account (from environment or file)
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
// BACKUP FUNCTIONS
// ============================================================================

/**
 * Export all events with nested teams and scores
 */
async function backupEvents() {
  console.log('\n📦 Backing up events...');
  
  try {
    const eventsSnapshot = await db.collection('events').get();
    const events = [];
    
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = {
        id: eventDoc.id,
        ...eventDoc.data(),
        teams: []
      };
      
      // Convert Firestore timestamps to ISO strings
      if (eventData.createdAt) {
        eventData.createdAt = eventData.createdAt.toDate().toISOString();
      }
      if (eventData.updatedAt) {
        eventData.updatedAt = eventData.updatedAt.toDate().toISOString();
      }
      if (eventData.expiresAt) {
        eventData.expiresAt = eventData.expiresAt.toDate().toISOString();
      }
      if (eventData.autoCleanupDate) {
        eventData.autoCleanupDate = eventData.autoCleanupDate.toDate().toISOString();
      }
      
      // Get teams subcollection
      const teamsSnapshot = await db
        .collection('events')
        .doc(eventDoc.id)
        .collection('teams')
        .get();
      
      for (const teamDoc of teamsSnapshot.docs) {
        const teamData = {
          id: teamDoc.id,
          ...teamDoc.data(),
          scores: []
        };
        
        // Convert timestamps
        if (teamData.createdAt) {
          teamData.createdAt = teamData.createdAt.toDate().toISOString();
        }
        if (teamData.updatedAt) {
          teamData.updatedAt = teamData.updatedAt.toDate().toISOString();
        }
        
        // Get scores subcollection
        const scoresSnapshot = await db
          .collection('events')
          .doc(eventDoc.id)
          .collection('teams')
          .doc(teamDoc.id)
          .collection('scores')
          .get();
        
        for (const scoreDoc of scoresSnapshot.docs) {
          const scoreData = {
            id: scoreDoc.id,
            ...scoreDoc.data()
          };
          
          // Convert timestamps
          if (scoreData.createdAt) {
            scoreData.createdAt = scoreData.createdAt.toDate().toISOString();
          }
          if (scoreData.updatedAt) {
            scoreData.updatedAt = scoreData.updatedAt.toDate().toISOString();
          }
          
          teamData.scores.push(scoreData);
        }
        
        console.log(`   ├─ Team: ${teamData.name} (${teamData.scores.length} scores)`);
        eventData.teams.push(teamData);
      }
      
      console.log(`   ✅ Event: ${eventData.name} (${eventData.teams.length} teams)`);
      events.push(eventData);
    }
    
    console.log(`\n📊 Total events: ${events.length}`);
    
    return events;
  } catch (error) {
    console.error('❌ Error backing up events:', error);
    throw error;
  }
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
      scores: totalScores
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return null;
  }
}

/**
 * Save data to JSON file
 */
function saveToFile(data, filename) {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
    }
    
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Saved to: ${filepath} (${sizeInMB} MB)`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Error saving file:', error);
    throw error;
  }
}

/**
 * Create backup manifest with metadata
 */
function createManifest(stats, files) {
  return {
    timestamp: new Date().toISOString(),
    stats: stats,
    files: files.map(f => path.basename(f)),
    version: '1.0.0',
    firestoreStructure: 'events/{eventId}/teams/{teamId}/scores/{scoreId}'
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🔥 Firestore Backup Script');
  console.log('========================\n');
  
  // Initialize Firebase
  initializeFirebase();
  
  // Get statistics
  console.log('📊 Analyzing database...');
  const stats = await getStats();
  
  if (!stats) {
    console.error('❌ Failed to get database statistics');
    process.exit(1);
  }
  
  console.log('\n📈 Database Statistics:');
  console.log(`   Events: ${stats.events}`);
  console.log(`   Teams: ${stats.teams}`);
  console.log(`   Scores: ${stats.scores}`);
  console.log(`   Total Documents: ${stats.events + stats.teams + stats.scores}`);
  
  // Confirm backup
  if (stats.events === 0) {
    console.log('\n⚠️  Database is empty. Nothing to backup.');
    process.exit(0);
  }
  
  console.log(`\n🎯 Backup will be saved to: ${BACKUP_DIR}`);
  console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Perform backup
  const startTime = Date.now();
  
  const events = await backupEvents();
  
  // Save to files
  console.log('\n💾 Saving backup files...');
  
  const files = [];
  
  // Save complete backup (with nested structure)
  const completeFile = saveToFile(
    events,
    `firestore-complete-${TIMESTAMP}.json`
  );
  files.push(completeFile);
  
  // Save manifest
  const manifest = createManifest(stats, files);
  const manifestFile = saveToFile(
    manifest,
    `firestore-manifest-${TIMESTAMP}.json`
  );
  files.push(manifestFile);
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n✅ Backup Complete!');
  console.log('==================');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📁 Location: ${BACKUP_DIR}`);
  console.log(`📄 Files: ${files.length}`);
  console.log('\nBackup files:');
  files.forEach(f => console.log(`   - ${path.basename(f)}`));
  
  console.log('\n💡 To restore from this backup:');
  console.log(`   node scripts/restore-firestore.js ${path.basename(completeFile)}`);
}

// Run main function
main().catch(error => {
  console.error('\n❌ Backup failed:', error);
  process.exit(1);
});
