/**
 * Test Firebase Connection
 * This script tests both client and admin Firebase connections
 */

const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('🔥 Testing Firebase Configuration...\n');
console.log('=' .repeat(60));

// Test 1: Environment Variables
console.log('\n📋 Test 1: Environment Variables');
console.log('-'.repeat(60));

const requiredClientVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

let allVarsPresent = true;
for (const varName of requiredClientVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allVarsPresent = false;
  }
}

if (allVarsPresent) {
  console.log('\n✅ All client environment variables present');
} else {
  console.log('\n❌ Some environment variables are missing');
  process.exit(1);
}

// Test 2: Service Account
console.log('\n📋 Test 2: Service Account');
console.log('-'.repeat(60));

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const accountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    console.log(`Looking for service account at: ${accountPath}`);
    serviceAccount = require(accountPath);
    console.log(`✅ Service account loaded`);
    console.log(`   Project ID: ${serviceAccount.project_id}`);
    console.log(`   Client Email: ${serviceAccount.client_email}`);
  } catch (error) {
    console.log(`❌ Failed to load service account: ${error.message}`);
    console.log('\n📝 Instructions:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Select project: attendance-management-sy-9d277');
    console.log('3. Go to Project Settings > Service Accounts');
    console.log('4. Click "Generate New Private Key"');
    console.log('5. Save as: firebase-service-account.json in project root');
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log(`✅ Service account loaded from environment variable`);
  } catch (error) {
    console.log(`❌ Failed to parse service account JSON: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log('❌ No service account credentials found');
  console.log('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_KEY');
  process.exit(1);
}

// Test 3: Firebase Admin SDK
console.log('\n📋 Test 3: Firebase Admin SDK Connection');
console.log('-'.repeat(60));

const admin = require('firebase-admin');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.log(`❌ Failed to initialize Firebase Admin: ${error.message}`);
  process.exit(1);
}

// Test 4: Firestore Connection
console.log('\n📋 Test 4: Firestore Database Connection');
console.log('-'.repeat(60));

async function testFirestore() {
  try {
    const db = admin.firestore();
    
    // Try to read from a collection (doesn't matter if it's empty)
    const testCollection = await db.collection('events').limit(1).get();
    console.log('✅ Firestore connection successful');
    console.log(`   Found ${testCollection.size} event(s) in database`);
    
    return true;
  } catch (error) {
    console.log(`❌ Firestore connection failed: ${error.message}`);
    
    if (error.code === 'failed-precondition') {
      console.log('\n📝 Firestore Database not enabled:');
      console.log('1. Go to Firebase Console');
      console.log('2. Click "Firestore Database" in sidebar');
      console.log('3. Click "Create Database"');
      console.log('4. Choose a location and click "Enable"');
    }
    
    return false;
  }
}

// Test 5: Create Test Document
async function testWrite() {
  console.log('\n📋 Test 5: Write Test');
  console.log('-'.repeat(60));
  
  try {
    const db = admin.firestore();
    const testRef = db.collection('_test_connection').doc('test');
    
    await testRef.set({
      message: 'Firebase connection test',
      timestamp: admin.firestore.Timestamp.now(),
      success: true,
    });
    
    console.log('✅ Write test successful');
    
    // Clean up
    await testRef.delete();
    console.log('✅ Cleanup successful');
    
    return true;
  } catch (error) {
    console.log(`❌ Write test failed: ${error.message}`);
    
    if (error.code === 'permission-denied') {
      console.log('\n📝 Permission denied:');
      console.log('1. Go to Firestore Database > Rules in Firebase Console');
      console.log('2. Make sure rules are published');
      console.log('3. Wait 1-2 minutes for rules to propagate');
    }
    
    return false;
  }
}

// Run all tests
(async () => {
  const firestoreConnected = await testFirestore();
  
  if (firestoreConnected) {
    await testWrite();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 All tests completed!');
  console.log('='.repeat(60));
  
  console.log('\n💡 Next Steps:');
  console.log('1. Upload firestore.rules to Firebase Console');
  console.log('2. Run: node migrate-add-event-modes.js');
  console.log('3. Run: npm run dev');
  console.log('4. Test event creation at http://localhost:3000\n');
  
  process.exit(0);
})();
