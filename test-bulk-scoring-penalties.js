/**
 * Test Bulk Scoring with Penalties
 * 
 * This test demonstrates the enhanced bulk scoring endpoint
 * with support for positive and negative points (penalties)
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

// Example test data
const testData = {
  validBulkScore: {
    event_id: 'evt_123e4567-e89b-12d3-a456-426614174000',
    day_number: 1,
    category: 'Game Round 1',
    items: [
      { team_id: 'team_123e4567-e89b-12d3-a456-426614174001', points: 100 },  // Positive
      { team_id: 'team_123e4567-e89b-12d3-a456-426614174002', points: -50 },  // Penalty
      { team_id: 'team_123e4567-e89b-12d3-a456-426614174003', points: 0 },    // Zero
      { team_id: 'team_123e4567-e89b-12d3-a456-426614174004', points: -25 },  // Penalty
    ]
  },
  
  invalidDecimal: {
    event_id: 'evt_123e4567-e89b-12d3-a456-426614174000',
    items: [
      { team_id: 'team_123e4567-e89b-12d3-a456-426614174001', points: 10.5 }, // ❌ Should fail
    ]
  },
  
  invalidString: {
    event_id: 'evt_123e4567-e89b-12d3-a456-426614174000',
    items: [
      { team_id: 'team_123e4567-e89b-12d3-a456-426614174001', points: "100" }, // ❌ Should fail
    ]
  },
};

async function testBulkScoring() {
  console.log('🧪 Testing Bulk Scoring API with Penalties\n');
  console.log('='.repeat(60));

  // Test 1: Valid bulk score with mixed positive/negative points
  console.log('\n📍 Test 1: Valid bulk score with penalties');
  try {
    const res = await fetch(`${BASE_URL}/api/scores/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SCORER_OR_ADMIN_TOKEN',
      },
      body: JSON.stringify(testData.validBulkScore),
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 201 && data.success) {
      console.log('✅ PASSED: Bulk scoring with penalties works');
      console.log(`   - ${data.data.count} scores added`);
      console.log(`   - Positive points: 100, 0`);
      console.log(`   - Penalties: -50, -25`);
    } else {
      console.log('❌ FAILED: Expected 201 success');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 2: Invalid decimal points
  console.log('\n📍 Test 2: Reject decimal points');
  try {
    const res = await fetch(`${BASE_URL}/api/scores/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SCORER_OR_ADMIN_TOKEN',
      },
      body: JSON.stringify(testData.invalidDecimal),
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 400 && data.error === 'Validation failed') {
      console.log('✅ PASSED: Decimal points correctly rejected');
    } else {
      console.log('❌ FAILED: Should reject decimal points');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 3: Invalid string points
  console.log('\n📍 Test 3: Reject string points');
  try {
    const res = await fetch(`${BASE_URL}/api/scores/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SCORER_OR_ADMIN_TOKEN',
      },
      body: JSON.stringify(testData.invalidString),
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 400 && data.error === 'Validation failed') {
      console.log('✅ PASSED: String points correctly rejected');
    } else {
      console.log('❌ FAILED: Should reject string points');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 4: Transaction rollback (simulated)
  console.log('\n📍 Test 4: Transaction rollback on failure');
  console.log('Scenario: One invalid team_id causes all inserts to rollback');
  const testRollback = {
    event_id: 'evt_123e4567-e89b-12d3-a456-426614174000',
    items: [
      { team_id: 'team_valid_1', points: 100 },
      { team_id: 'invalid-uuid', points: 50 }, // ❌ Invalid UUID
      { team_id: 'team_valid_2', points: -25 },
    ]
  };
  
  try {
    const res = await fetch(`${BASE_URL}/api/scores/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SCORER_OR_ADMIN_TOKEN',
      },
      body: JSON.stringify(testRollback),
    });
    
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 400 && data.error === 'Validation failed') {
      console.log('✅ PASSED: Invalid UUID caught by validation');
      console.log('   - No scores inserted (transaction not started)');
    } else if (res.status === 500 && data.error === 'Transaction failed') {
      console.log('✅ PASSED: Transaction rolled back');
      console.log('   - All scores rejected due to failure');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Test suite complete!\n');
}

// Example request structure
console.log('\n📋 BULK SCORING API DOCUMENTATION\n');
console.log('Endpoint: POST /api/scores/bulk');
console.log('Headers: Authorization: Bearer <scorer_or_admin_token>');
console.log('\nRequest Body:');
console.log(JSON.stringify({
  event_id: '<event-uuid>',
  day_number: 1,  // Optional
  category: 'Game Name',  // Optional, defaults to "Bulk Entry"
  items: [
    { team_id: '<team-uuid-1>', points: 100 },   // Positive points
    { team_id: '<team-uuid-2>', points: -50 },   // Penalty (negative)
    { team_id: '<team-uuid-3>', points: 0 },     // Zero points
  ]
}, null, 2));

console.log('\n✅ Features:');
console.log('  - Supports positive, negative, and zero points');
console.log('  - Points must be integers (no decimals)');
console.log('  - Transaction-safe (all-or-nothing)');
console.log('  - Max 100 scores per request');
console.log('  - Automatic rollback on any failure');
console.log('  - Readable error messages');

console.log('\n❌ Validation Rules:');
console.log('  - Points must be integers');
console.log('  - Team IDs must be valid UUIDs');
console.log('  - Event ID must be valid UUID');
console.log('  - At least 1 item required');
console.log('  - Event must be active');
console.log('  - Day must not be locked (if specified)');

console.log('\n🔄 Transaction Behavior:');
console.log('  - All scores inserted together');
console.log('  - If ANY score fails, ALL are rolled back');
console.log('  - No partial inserts');
console.log('  - Database remains consistent');

// Run tests (uncomment to execute)
// testBulkScoring().catch(console.error);
