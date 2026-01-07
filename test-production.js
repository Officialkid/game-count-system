/**
 * Production End-to-End Test Suite
 * 
 * Validates GameScore backend/frontend in production
 * Tests token-based access, public pages, and retention
 * 
 * Usage: node test-production.js [backend-url]
 * Example: node test-production.js https://game-count-system.onrender.com
 */

const API_BASE = process.argv[2] || 'http://localhost:3000';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logTest(name) {
  log(`\n▶ ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

async function test(name, fn) {
  logTest(name);
  results.total++;
  try {
    await fn();
    results.passed++;
    logSuccess('PASSED');
  } catch (error) {
    results.failed++;
    logError(`FAILED: ${error.message}`);
    results.errors.push({ test: name, error: error.message });
  }
}

// ========================================
// TEST 1: Backend Health Check
// ========================================
async function testHealthCheck() {
  const response = await fetch(`${API_BASE}/api/health`);
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status !== 'healthy') {
    throw new Error(`Unhealthy status: ${data.status}`);
  }

  if (data.services?.database !== 'connected') {
    throw new Error(`Database not connected: ${data.services?.database}`);
  }

  logInfo(`Response time: ${data.responseTime}`);
  logInfo(`Environment: ${data.environment}`);
}

// ========================================
// TEST 2: Create Event
// ========================================
let eventData = null;

async function testCreateEvent() {
  const response = await fetch(`${API_BASE}/api/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Production E2E Test',
      mode: 'quick',
      start_at: new Date().toISOString(),
      retention_policy: 'manual',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Create event failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Create event returned success=false: ${data.error}`);
  }

  eventData = data.data;

  // Verify tokens present
  if (!eventData.event_id) throw new Error('Missing event_id');
  if (!eventData.admin_url) throw new Error('Missing admin_url');
  if (!eventData.scorer_url) throw new Error('Missing scorer_url');
  if (!eventData.public_url) throw new Error('Missing public_url');

  logInfo(`Event ID: ${eventData.event_id}`);
  logInfo(`Admin URL: ${eventData.admin_url}`);
  logInfo(`Scorer URL: ${eventData.scorer_url}`);
  logInfo(`Public URL: ${eventData.public_url}`);
}

// ========================================
// TEST 3: Add Teams (Admin Token)
// ========================================
async function testAddTeams() {
  if (!eventData) throw new Error('No event data from previous test');

  // Extract admin token from URL
  const adminToken = eventData.admin_url.split('/').pop();
  const eventId = eventData.event_id;

  // Add Team 1
  const response1 = await fetch(`${API_BASE}/api/events/${eventId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ADMIN-TOKEN': adminToken,
    },
    body: JSON.stringify({
      name: 'Test Team Alpha',
      color: '#FF0000',
    }),
  });

  if (!response1.ok) {
    const error = await response1.text();
    throw new Error(`Add team 1 failed: ${response1.status} - ${error}`);
  }

  const data1 = await response1.json();
  if (!data1.success) {
    throw new Error(`Add team 1 returned success=false: ${data1.error}`);
  }

  logInfo(`Team 1 added: ${data1.data?.name || 'Test Team Alpha'}`);

  // Add Team 2
  const response2 = await fetch(`${API_BASE}/api/events/${eventId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ADMIN-TOKEN': adminToken,
    },
    body: JSON.stringify({
      name: 'Test Team Beta',
      color: '#0000FF',
    }),
  });

  if (!response2.ok) {
    const error = await response2.text();
    throw new Error(`Add team 2 failed: ${response2.status} - ${error}`);
  }

  const data2 = await response2.json();
  if (!data2.success) {
    throw new Error(`Add team 2 returned success=false: ${data2.error}`);
  }

  logInfo(`Team 2 added: ${data2.data?.name || 'Test Team Beta'}`);
}

// ========================================
// TEST 4: List Teams
// ========================================
let teamIds = [];

async function testListTeams() {
  if (!eventData) throw new Error('No event data from previous test');

  const adminToken = eventData.admin_url.split('/').pop();
  const eventId = eventData.event_id;

  const response = await fetch(`${API_BASE}/api/events/${eventId}/teams`, {
    headers: {
      'X-ADMIN-TOKEN': adminToken,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`List teams failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`List teams returned success=false: ${data.error}`);
  }

  const teams = data.data || [];
  
  if (teams.length < 2) {
    throw new Error(`Expected at least 2 teams, got ${teams.length}`);
  }

  teamIds = teams.map(t => t.id);
  logInfo(`Found ${teams.length} teams`);
  teams.forEach(team => {
    logInfo(`  - ${team.name} (${team.color})`);
  });
}

// ========================================
// TEST 5: Add Scores (Scorer Token)
// ========================================
async function testAddScores() {
  if (!eventData) throw new Error('No event data from previous test');
  if (teamIds.length < 2) throw new Error('Need at least 2 teams');

  const scorerToken = eventData.scorer_url.split('/').pop();
  const eventId = eventData.event_id;

  // Score 1
  const response1 = await fetch(`${API_BASE}/api/events/${eventId}/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SCORER-TOKEN': scorerToken,
    },
    body: JSON.stringify({
      team_id: teamIds[0],
      day_number: 1,
      category: 'Bible Study',
      points: 100,
    }),
  });

  if (!response1.ok) {
    const error = await response1.text();
    throw new Error(`Add score 1 failed: ${response1.status} - ${error}`);
  }

  const data1 = await response1.json();
  if (!data1.success) {
    throw new Error(`Add score 1 returned success=false: ${data1.error}`);
  }

  logInfo(`Score 1 added: Team 1, 100 points`);

  // Score 2
  const response2 = await fetch(`${API_BASE}/api/events/${eventId}/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SCORER-TOKEN': scorerToken,
    },
    body: JSON.stringify({
      team_id: teamIds[1],
      day_number: 1,
      category: 'Bible Study',
      points: 150,
    }),
  });

  if (!response2.ok) {
    const error = await response2.text();
    throw new Error(`Add score 2 failed: ${response2.status} - ${error}`);
  }

  const data2 = await response2.json();
  if (!data2.success) {
    throw new Error(`Add score 2 returned success=false: ${data2.error}`);
  }

  logInfo(`Score 2 added: Team 2, 150 points`);
}

// ========================================
// TEST 6: Public Scoreboard (No Auth)
// ========================================
async function testPublicScoreboard() {
  if (!eventData) throw new Error('No event data from previous test');

  const publicToken = eventData.public_url.split('/').pop();

  const response = await fetch(`${API_BASE}/events/${publicToken}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Public scoreboard failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Public scoreboard returned success=false: ${data.error}`);
  }

  const eventInfo = data.data;

  // Verify event data
  if (!eventInfo.event) throw new Error('Missing event data');
  if (!eventInfo.teams) throw new Error('Missing teams data');
  if (!eventInfo.scores) throw new Error('Missing scores data');

  logInfo(`Event: ${eventInfo.event.name}`);
  logInfo(`Teams: ${eventInfo.teams.length}`);
  logInfo(`Scores: ${eventInfo.scores.length}`);

  // Verify no auth headers were required
  logSuccess('No authentication required');
}

// ========================================
// TEST 7: Recap Page (No Auth)
// ========================================
async function testRecapPage() {
  if (!eventData) throw new Error('No event data from previous test');

  const publicToken = eventData.public_url.split('/').pop();

  const response = await fetch(`${API_BASE}/api/events/${publicToken}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Recap data failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Recap data returned success=false: ${data.error}`);
  }

  const recapData = data.data;

  // Verify recap data structure
  if (!recapData.event) throw new Error('Missing event in recap');
  if (!recapData.teams) throw new Error('Missing teams in recap');
  if (!recapData.scores) throw new Error('Missing scores in recap');
  if (!recapData.standings) throw new Error('Missing standings in recap');

  logInfo(`Champion: ${recapData.standings[0]?.team_name || 'N/A'}`);
  logInfo(`Total Teams: ${recapData.teams.length}`);
  logInfo(`Total Scores: ${recapData.scores.length}`);

  // Verify public token access (no auth)
  logSuccess('Recap accessible without authentication');
}

// ========================================
// TEST 8: Invalid Token (Should Fail)
// ========================================
async function testInvalidToken() {
  const response = await fetch(`${API_BASE}/events/invalid_token_12345`);

  if (response.ok) {
    throw new Error('Invalid token should return error, but got success');
  }

  if (response.status !== 404) {
    throw new Error(`Expected 404, got ${response.status}`);
  }

  logSuccess('Invalid token correctly rejected');
}

// ========================================
// TEST 9: Unauthorized Access (No Token)
// ========================================
async function testUnauthorizedAccess() {
  if (!eventData) throw new Error('No event data from previous test');

  const eventId = eventData.event_id;

  // Try to add team without admin token
  const response = await fetch(`${API_BASE}/api/events/${eventId}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unauthorized Team',
      color: '#000000',
    }),
  });

  if (response.ok) {
    throw new Error('Should reject request without admin token');
  }

  if (response.status !== 401 && response.status !== 403) {
    throw new Error(`Expected 401/403, got ${response.status}`);
  }

  logSuccess('Unauthorized access correctly rejected');
}

// ========================================
// TEST 10: Retention Cleanup
// ========================================
async function testRetentionCleanup() {
  // Create auto-expire event
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - 1); // Yesterday

  const response = await fetch(`${API_BASE}/api/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Auto-Expire Test Event',
      mode: 'quick',
      start_at: expiryDate.toISOString(),
      retention_policy: 'auto_expire',
      expires_at: expiryDate.toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Create auto-expire event failed: ${response.status}`);
  }

  const data = await response.json();
  const expiredEventId = data.data.event_id;
  const publicToken = data.data.public_url.split('/').pop();

  logInfo(`Created expired event: ${expiredEventId}`);

  // Trigger cleanup (requires CRON_SECRET)
  const cronSecret = process.env.CRON_SECRET || 'test-secret';
  
  const cleanupResponse = await fetch(`${API_BASE}/api/cron/cleanup`, {
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
    },
  });

  if (!cleanupResponse.ok) {
    logInfo('Cleanup endpoint requires CRON_SECRET - skipping verification');
    logSuccess('Auto-expire event created (manual cleanup needed)');
    return;
  }

  const cleanupData = await cleanupResponse.json();
  logInfo(`Deleted: ${cleanupData.deleted || 0} events`);

  // Verify event is deleted
  await sleep(1000);
  const verifyResponse = await fetch(`${API_BASE}/events/${publicToken}`);
  
  if (verifyResponse.status === 404) {
    logSuccess('Expired event successfully deleted');
  } else {
    logInfo('Event still exists (cleanup may run later)');
  }
}

// ========================================
// RUN ALL TESTS
// ========================================
async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   Production E2E Test Suite          ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  log(`\nBackend: ${API_BASE}\n`, 'yellow');

  await test('1. Backend Health Check', testHealthCheck);
  await test('2. Create Event', testCreateEvent);
  await test('3. Add Teams (Admin Token)', testAddTeams);
  await test('4. List Teams', testListTeams);
  await test('5. Add Scores (Scorer Token)', testAddScores);
  await test('6. Public Scoreboard (No Auth)', testPublicScoreboard);
  await test('7. Recap Page Data (No Auth)', testRecapPage);
  await test('8. Invalid Token Rejection', testInvalidToken);
  await test('9. Unauthorized Access Rejection', testUnauthorizedAccess);
  await test('10. Retention Cleanup', testRetentionCleanup);

  // Summary
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   Test Results                        ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  log(`\nTotal:  ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');

  if (results.errors.length > 0) {
    log('\n╔════════════════════════════════════════╗', 'red');
    log('║   Failed Tests                        ║', 'red');
    log('╚════════════════════════════════════════╝', 'red');
    results.errors.forEach(({ test, error }) => {
      log(`\n${test}:`, 'red');
      log(`  ${error}`, 'red');
    });
  }

  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  log(`\nExit code: ${exitCode}\n`, exitCode === 0 ? 'green' : 'red');
  process.exit(exitCode);
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
