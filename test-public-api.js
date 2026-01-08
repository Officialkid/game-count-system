/**
 * Test Public API Endpoints
 * 
 * Tests the refactored token-based public APIs
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

async function testPublicAPIs() {
  console.log('🧪 Testing Public API Endpoints\n');
  console.log('='.repeat(60));

  // Test 1: Verify endpoint with invalid token (should return 404)
  console.log('\n📍 Test 1: Verify with invalid token');
  try {
    const res = await fetch(`${BASE_URL}/api/public/verify/invalid_token_12345`);
    const data = await res.json();
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 404 && data.message) {
      console.log('✅ PASSED: Returns 404 with friendly message');
    } else {
      console.log('❌ FAILED: Expected 404 with message');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 2: Scores endpoint with invalid token (should return 404)
  console.log('\n📍 Test 2: Scores with invalid token');
  try {
    const res = await fetch(`${BASE_URL}/api/public/invalid_token_12345/scores`);
    const data = await res.json();
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 404 && data.message) {
      console.log('✅ PASSED: Returns 404 with friendly message');
    } else {
      console.log('❌ FAILED: Expected 404 with message');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 3: Try POST on verify endpoint (should return 405)
  console.log('\n📍 Test 3: POST to verify endpoint (should block)');
  try {
    const res = await fetch(`${BASE_URL}/api/public/verify/test_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    const data = await res.json();
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 405) {
      console.log('✅ PASSED: POST blocked with 405');
    } else {
      console.log('❌ FAILED: Expected 405 Method Not Allowed');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 4: Try PUT on scores endpoint (should return 405)
  console.log('\n📍 Test 4: PUT to scores endpoint (should block)');
  try {
    const res = await fetch(`${BASE_URL}/api/public/test_token/scores`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    const data = await res.json();
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (res.status === 405) {
      console.log('✅ PASSED: PUT blocked with 405');
    } else {
      console.log('❌ FAILED: Expected 405 Method Not Allowed');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  // Test 5: Verify no authentication headers are required
  console.log('\n📍 Test 5: No auth headers required');
  try {
    const res = await fetch(`${BASE_URL}/api/public/verify/test_token`, {
      // Intentionally sending NO headers
      headers: {}
    });
    const data = await res.json();
    
    // Should not return 401 (even for invalid token - should be 404)
    if (res.status !== 401) {
      console.log('✅ PASSED: No 401 Unauthorized (unauthenticated access works)');
    } else {
      console.log('❌ FAILED: Returned 401 - should never require auth');
    }
  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Test suite complete!\n');
}

// Run tests
testPublicAPIs().catch(console.error);
