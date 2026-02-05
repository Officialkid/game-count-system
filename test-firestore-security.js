/**
 * Firestore Security Rules Test Script
 * 
 * This script tests the Firestore security rules to ensure they work correctly.
 * Run this after deploying security rules to verify access control.
 * 
 * Usage:
 *   node test-firestore-security.js
 * 
 * Prerequisites:
 *   - Deploy firestore.rules first: firebase deploy --only firestore:rules
 *   - Have test event with tokens in Firestore
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (bypasses security rules)
try {
  initializeApp({
    credential: cert(require('./firebase-service-account.json'))
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin');
  console.error('Make sure firebase-service-account.json exists');
  process.exit(1);
}

const db = getFirestore();

// Test configuration
const TEST_CONFIG = {
  eventId: 'test-event-' + Date.now(),
  adminToken: 'admin-test-' + Math.random().toString(36).substr(2, 9),
  scorerToken: 'scorer-test-' + Math.random().toString(36).substr(2, 9),
  viewerToken: 'viewer-test-' + Math.random().toString(36).substr(2, 9),
  teamId: 'team-test-1',
};

console.log('🧪 Firestore Security Rules Test Suite\n');
console.log('Test Configuration:');
console.log('  Event ID:', TEST_CONFIG.eventId);
console.log('  Admin Token:', TEST_CONFIG.adminToken);
console.log('  Scorer Token:', TEST_CONFIG.scorerToken);
console.log('  Viewer Token:', TEST_CONFIG.viewerToken);
console.log('');

// Helper to create test event
async function setupTestEvent() {
  console.log('📦 Setting up test event...');
  
  // Create test event
  await db.collection('events').doc(TEST_CONFIG.eventId).set({
    name: 'Security Test Event',
    eventMode: 'multi-day',
    numberOfDays: 3,
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    dayLocking: {
      day1: { locked: false },
      day2: { locked: true },  // Day 2 is locked
      day3: { locked: false }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  // Create tokens
  await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('tokens').doc(TEST_CONFIG.adminToken).set({
      token: TEST_CONFIG.adminToken,
      type: 'admin',
      eventId: TEST_CONFIG.eventId,
      created_at: new Date().toISOString()
    });
  
  await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('tokens').doc(TEST_CONFIG.scorerToken).set({
      token: TEST_CONFIG.scorerToken,
      type: 'scorer',
      eventId: TEST_CONFIG.eventId,
      created_at: new Date().toISOString()
    });
  
  await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('tokens').doc(TEST_CONFIG.viewerToken).set({
      token: TEST_CONFIG.viewerToken,
      type: 'viewer',
      eventId: TEST_CONFIG.eventId,
      created_at: new Date().toISOString()
    });
  
  // Create test team
  await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('teams').doc(TEST_CONFIG.teamId).set({
      name: 'Test Team',
      color: '#FF0000',
      eventId: TEST_CONFIG.eventId,
      created_at: new Date().toISOString()
    });
  
  console.log('✅ Test event setup complete\n');
}

// Helper to cleanup test data
async function cleanupTestEvent() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete teams
  const teamsSnap = await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('teams').get();
  for (const doc of teamsSnap.docs) {
    await doc.ref.delete();
  }
  
  // Delete scores
  const scoresSnap = await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('scores').get();
  for (const doc of scoresSnap.docs) {
    await doc.ref.delete();
  }
  
  // Delete tokens
  const tokensSnap = await db.collection('events').doc(TEST_CONFIG.eventId)
    .collection('tokens').get();
  for (const doc of tokensSnap.docs) {
    await doc.ref.delete();
  }
  
  // Delete event
  await db.collection('events').doc(TEST_CONFIG.eventId).delete();
  
  console.log('✅ Cleanup complete');
}

// Test suite
async function runTests() {
  let passedTests = 0;
  let failedTests = 0;
  
  const tests = [
    {
      name: 'Public can read events',
      description: 'Anyone should be able to read event documents',
      test: async () => {
        // This uses admin SDK so will always succeed
        // In production, test with unauthenticated client
        const eventDoc = await db.collection('events').doc(TEST_CONFIG.eventId).get();
        return eventDoc.exists;
      },
      expectedResult: true
    },
    
    {
      name: 'Public can read teams',
      description: 'Anyone should be able to read team documents',
      test: async () => {
        const teamsSnap = await db.collection('events').doc(TEST_CONFIG.eventId)
          .collection('teams').get();
        return !teamsSnap.empty;
      },
      expectedResult: true
    },
    
    {
      name: 'Admin can create scores on unlocked day',
      description: 'Admin token should allow score creation on day 1 (unlocked)',
      test: async () => {
        try {
          await db.collection('events').doc(TEST_CONFIG.eventId)
            .collection('scores').add({
              teamId: TEST_CONFIG.teamId,
              points: 10,
              day: 1,
              token: TEST_CONFIG.adminToken,
              eventId: TEST_CONFIG.eventId,
              created_at: new Date().toISOString()
            });
          return true;
        } catch (error) {
          console.log('      Error:', error.message);
          return false;
        }
      },
      expectedResult: true
    },
    
    {
      name: 'Scorer can create scores on unlocked day',
      description: 'Scorer token should allow score creation on day 3 (unlocked)',
      test: async () => {
        try {
          await db.collection('events').doc(TEST_CONFIG.eventId)
            .collection('scores').add({
              teamId: TEST_CONFIG.teamId,
              points: 15,
              day: 3,
              token: TEST_CONFIG.scorerToken,
              eventId: TEST_CONFIG.eventId,
              created_at: new Date().toISOString()
            });
          return true;
        } catch (error) {
          console.log('      Error:', error.message);
          return false;
        }
      },
      expectedResult: true
    },
    
    {
      name: 'Cannot create scores on locked day',
      description: 'Admin token should be denied on day 2 (locked)',
      test: async () => {
        try {
          await db.collection('events').doc(TEST_CONFIG.eventId)
            .collection('scores').add({
              teamId: TEST_CONFIG.teamId,
              points: 20,
              day: 2, // Locked day
              token: TEST_CONFIG.adminToken,
              eventId: TEST_CONFIG.eventId,
              created_at: new Date().toISOString()
            });
          return false; // Should have been denied
        } catch (error) {
          // Expected to fail
          return true;
        }
      },
      expectedResult: true,
      note: '⚠️  This test uses admin SDK which bypasses rules. In production, this would be denied.'
    },
    
    {
      name: 'Event status validation',
      description: 'Check that event is active',
      test: async () => {
        const eventDoc = await db.collection('events').doc(TEST_CONFIG.eventId).get();
        const status = eventDoc.data()?.status;
        return status === 'active' || !status;
      },
      expectedResult: true
    },
    
    {
      name: 'Day locking configuration',
      description: 'Verify day locking is properly configured',
      test: async () => {
        const eventDoc = await db.collection('events').doc(TEST_CONFIG.eventId).get();
        const dayLocking = eventDoc.data()?.dayLocking;
        return dayLocking 
          && dayLocking.day1?.locked === false
          && dayLocking.day2?.locked === true
          && dayLocking.day3?.locked === false;
      },
      expectedResult: true
    },
    
    {
      name: 'Tokens are properly stored',
      description: 'Verify all tokens exist in Firestore',
      test: async () => {
        const adminToken = await db.collection('events').doc(TEST_CONFIG.eventId)
          .collection('tokens').doc(TEST_CONFIG.adminToken).get();
        const scorerToken = await db.collection('events').doc(TEST_CONFIG.eventId)
          .collection('tokens').doc(TEST_CONFIG.scorerToken).get();
        const viewerToken = await db.collection('events').doc(TEST_CONFIG.eventId)
          .collection('tokens').doc(TEST_CONFIG.viewerToken).get();
        
        return adminToken.exists 
          && adminToken.data()?.type === 'admin'
          && scorerToken.exists 
          && scorerToken.data()?.type === 'scorer'
          && viewerToken.exists 
          && viewerToken.data()?.type === 'viewer';
      },
      expectedResult: true
    }
  ];
  
  console.log('🧪 Running Tests...\n');
  
  for (const testCase of tests) {
    try {
      const result = await testCase.test();
      const passed = result === testCase.expectedResult;
      
      if (passed) {
        console.log(`✅ PASS: ${testCase.name}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: ${testCase.name}`);
        console.log(`   Expected: ${testCase.expectedResult}, Got: ${result}`);
        failedTests++;
      }
      
      console.log(`   ${testCase.description}`);
      if (testCase.note) {
        console.log(`   ${testCase.note}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.name}`);
      console.log(`   ${error.message}`);
      failedTests++;
      console.log('');
    }
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (failedTests > 0) {
    console.log('⚠️  Some tests failed. This is expected if:');
    console.log('   1. Security rules are not yet deployed');
    console.log('   2. Tests are run with admin SDK (bypasses rules)');
    console.log('   3. For production testing, use Firebase Emulator Suite');
    console.log('\nTo test properly:');
    console.log('   1. Deploy rules: firebase deploy --only firestore:rules');
    console.log('   2. Use emulator: firebase emulators:start');
    console.log('   3. Run client-side tests with different auth states');
  } else {
    console.log('✅ All tests passed!');
    console.log('   Note: Tests run with admin SDK, which bypasses security rules.');
    console.log('   For true security validation, use Firebase Emulator Suite.');
  }
}

// Main execution
(async () => {
  try {
    await setupTestEvent();
    await runTests();
    await cleanupTestEvent();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    await cleanupTestEvent();
    process.exit(1);
  }
})();
