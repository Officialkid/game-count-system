/**
 * Standalone Event Cleanup Script
 * Run this manually or via cron: node scripts/cleanup-events.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  console.error('❌ No Firebase service account credentials found');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const COLLECTIONS = {
  EVENTS: 'events',
  TEAMS: 'teams',
  SCORES: 'scores',
  EVENT_DAYS: 'event_days',
};

/**
 * Check if event should be deleted
 */
function shouldDeleteEvent(event) {
  // Only Quick mode events can be auto-deleted
  if (event.eventMode !== 'quick') {
    return false;
  }

  // Only delete if past cleanup date
  if (!event.autoCleanupDate) {
    return false;
  }

  const cleanupTime = new Date(event.autoCleanupDate);
  const now = new Date();
  
  return now >= cleanupTime;
}

/**
 * Delete an event and all associated data
 */
async function deleteEventWithData(eventId, eventName) {
  try {
    console.log(`🗑️  Deleting event: ${eventName} (${eventId})`);

    // Delete scores
    const scoresSnapshot = await db.collection(COLLECTIONS.SCORES)
      .where('event_id', '==', eventId)
      .get();
    
    const scoreDeletions = [];
    scoresSnapshot.forEach(doc => {
      scoreDeletions.push(doc.ref.delete());
    });
    await Promise.all(scoreDeletions);
    console.log(`   Deleted ${scoresSnapshot.size} scores`);

    // Delete teams
    const teamsSnapshot = await db.collection(COLLECTIONS.TEAMS)
      .where('event_id', '==', eventId)
      .get();
    
    const teamDeletions = [];
    teamsSnapshot.forEach(doc => {
      teamDeletions.push(doc.ref.delete());
    });
    await Promise.all(teamDeletions);
    console.log(`   Deleted ${teamsSnapshot.size} teams`);

    // Delete event days
    const daysSnapshot = await db.collection(COLLECTIONS.EVENT_DAYS)
      .where('event_id', '==', eventId)
      .get();
    
    const dayDeletions = [];
    daysSnapshot.forEach(doc => {
      dayDeletions.push(doc.ref.delete());
    });
    await Promise.all(dayDeletions);
    console.log(`   Deleted ${daysSnapshot.size} event days`);

    // Delete event
    await db.collection(COLLECTIONS.EVENTS).doc(eventId).delete();
    console.log(`✅ Event deleted successfully`);

    return true;
  } catch (error) {
    console.error(`❌ Failed to delete event: ${eventName}`, error);
    return false;
  }
}

/**
 * Main cleanup function
 */
async function cleanupEvents() {
  console.log('🧹 Starting event cleanup...\n');
  console.log('=' .repeat(60));

  try {
    const eventsSnapshot = await db.collection(COLLECTIONS.EVENTS).get();
    
    if (eventsSnapshot.empty) {
      console.log('ℹ️  No events found');
      return;
    }

    console.log(`📋 Checking ${eventsSnapshot.size} events...\n`);

    let checked = 0;
    let deleted = 0;
    let skipped = 0;

    for (const doc of eventsSnapshot.docs) {
      const event = doc.data();
      checked++;

      if (shouldDeleteEvent(event)) {
        const success = await deleteEventWithData(doc.id, event.name);
        if (success) {
          deleted++;
        }
        console.log('');
      } else {
        skipped++;
        const reason = event.eventMode !== 'quick' 
          ? 'Not a Quick event' 
          : 'Cleanup date not reached';
        console.log(`⏭️  Skipping: ${event.name} (${reason})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Cleanup Summary:');
    console.log(`   Total Checked: ${checked}`);
    console.log(`   Deleted: ${deleted}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('='.repeat(60));

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupEvents().then(() => {
  console.log('\n✨ Process complete');
  process.exit(0);
});
