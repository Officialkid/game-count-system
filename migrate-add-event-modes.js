/**
 * Migration Script: Add Event Mode Fields to Existing Events
 * 
 * This script updates existing events in Firestore to include the new mode system fields.
 * Run: node migrate-add-event-modes.js
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const COLLECTIONS = {
  EVENTS: 'events',
};

/**
 * Determine event mode based on existing fields
 */
function determineEventMode(event) {
  const { number_of_days, mode, status } = event;
  
  // If event is very short, likely a quick event
  if (number_of_days === 1 && mode === 'continuous') {
    return 'quick';
  }
  
  // If multi-day event, likely a camp event
  if (number_of_days > 1 && number_of_days <= 30) {
    return 'camp';
  }
  
  // If very long duration or has organization info, advanced
  if (number_of_days > 30 || event.organization_id) {
    return 'advanced';
  }
  
  // Default to camp for multi-day, quick for single-day
  return number_of_days > 1 ? 'camp' : 'quick';
}

/**
 * Determine event status based on existing status
 */
function determineEventStatus(event) {
  const { status, is_finalized } = event;
  
  if (is_finalized) {
    return 'completed';
  }
  
  if (status === 'active') {
    return 'active';
  }
  
  if (status === 'expired') {
    return 'archived';
  }
  
  return 'draft';
}

/**
 * Calculate auto-cleanup date for quick events
 */
function calculateAutoCleanupDate(eventMode, createdAt, startAt) {
  if (eventMode !== 'quick') {
    return null;
  }
  
  // Use start date or created date
  const baseDate = startAt ? new Date(startAt) : new Date(createdAt);
  const cleanupDate = new Date(baseDate);
  cleanupDate.setDate(cleanupDate.getDate() + 1); // 24 hours for quick events
  
  return cleanupDate.toISOString();
}

/**
 * Migrate a single event
 */
async function migrateEvent(eventDoc) {
  const eventData = eventDoc.data();
  const eventId = eventDoc.id;
  
  // Skip if already migrated
  if (eventData.eventMode) {
    console.log(`  ⏭️  Event "${eventData.name}" already migrated`);
    return false;
  }
  
  // Determine mode and status
  const eventMode = determineEventMode(eventData);
  const eventStatus = determineEventStatus(eventData);
  
  // Determine if auth is required
  const requiresAuthentication = eventMode === 'advanced';
  
  // Calculate auto-cleanup date
  const autoCleanupDate = calculateAutoCleanupDate(
    eventMode,
    eventData.created_at,
    eventData.start_at
  );
  
  // Prepare update data
  const updateData = {
    eventMode,
    eventStatus,
    requiresAuthentication,
    scoringMode: eventData.mode || 'continuous', // Rename 'mode' to 'scoringMode'
    updated_at: admin.firestore.Timestamp.now(),
  };
  
  // Add auto-cleanup date if applicable
  if (autoCleanupDate) {
    updateData.autoCleanupDate = autoCleanupDate;
  }
  
  // Update the document
  await db.collection(COLLECTIONS.EVENTS).doc(eventId).update(updateData);
  
  console.log(`  ✅ Migrated "${eventData.name}" → ${eventMode} mode, ${eventStatus} status`);
  return true;
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Event Mode Migration\n');
  console.log('=' .repeat(60));
  
  try {
    // Get all events
    console.log('\n📋 Fetching events...');
    const eventsSnapshot = await db.collection(COLLECTIONS.EVENTS).get();
    
    if (eventsSnapshot.empty) {
      console.log('ℹ️  No events found in database');
      return;
    }
    
    console.log(`Found ${eventsSnapshot.size} events\n`);
    
    // Migrate each event
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const eventDoc of eventsSnapshot.docs) {
      const migrated = await migrateEvent(eventDoc);
      if (migrated) {
        migratedCount++;
      } else {
        skippedCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total Events:    ${eventsSnapshot.size}`);
    console.log(`   Migrated:        ${migratedCount}`);
    console.log(`   Already Migrated: ${skippedCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration completed successfully!');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Verify events in Firebase Console');
    console.log('   2. Check that eventMode and eventStatus are set correctly');
    console.log('   3. Test event creation with new mode selector');
    console.log('   4. Update frontend to use new fields');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => {
  console.log('\n✨ Process complete');
  process.exit(0);
});
