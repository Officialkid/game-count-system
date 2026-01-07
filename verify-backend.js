#!/usr/bin/env node
/**
 * Comprehensive backend verification test
 * Tests all API endpoints and database operations
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
let adminToken, scorerToken, publicToken, eventId, teamId, dayNumber;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function test1_CreateEvent() {
  log('\n📝 TEST 1: Create Event', 'cyan');
  
  const response = await makeRequest(`${BASE_URL}/api/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Test Summer Camp 2026',
      mode: 'camp',
      start_at: '2026-06-01T09:00:00Z',
      retention_policy: 'manual'
    }
  });

  if (response.status === 201 && response.body.success) {
    eventId = response.body.data.event_id;
    adminToken = response.body.data.admin_url.split('/').pop();
    scorerToken = response.body.data.scorer_url.split('/').pop();
    publicToken = response.body.data.public_url.split('/').pop();
    
    log(`✅ Event created: ${eventId}`, 'green');
    log(`   Admin Token: ${adminToken.substring(0, 20)}...`, 'green');
    log(`   Scorer Token: ${scorerToken.substring(0, 20)}...`, 'green');
    log(`   Public Token: ${publicToken.substring(0, 20)}...`, 'green');
    return true;
  }
  
  log(`❌ Failed: ${response.body.error?.message || 'Unknown error'}`, 'red');
  return false;
}

async function test2_CreateTeams() {
  log('\n👥 TEST 2: Create Teams', 'cyan');
  
  const teams = [
    { name: 'Red Dragons', color: '#ff0000' },
    { name: 'Blue Sharks', color: '#0000ff' },
    { name: 'Green Eagles', color: '#00ff00' }
  ];

  for (const team of teams) {
    const response = await makeRequest(`${BASE_URL}/api/events/${eventId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ADMIN-TOKEN': adminToken
      },
      body: team
    });

    if (response.status === 201 && response.body.success) {
      if (!teamId) teamId = response.body.data.id; // Save first team ID
      log(`✅ Team created: ${team.name}`, 'green');
    } else {
      log(`❌ Failed to create ${team.name}`, 'red');
      return false;
    }
  }
  
  return true;
}

async function test3_SubmitScores() {
  log('\n🎯 TEST 3: Submit Scores', 'cyan');
  
  const scores = [
    { day_number: 1, points: 50, category: 'Swimming' },
    { day_number: 1, points: 75, category: 'Running' },
    { day_number: 2, points: 100, category: 'Archery' }
  ];

  for (const score of scores) {
    const response = await makeRequest(`${BASE_URL}/api/events/${eventId}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SCORER-TOKEN': scorerToken
      },
      body: {
        ...score,
        team_id: teamId
      }
    });

    if (response.status === 201 && response.body.success) {
      log(`✅ Score added: Day ${score.day_number}, ${score.points} pts (${score.category})`, 'green');
    } else {
      log(`❌ Failed to add score for Day ${score.day_number}`, 'red');
      return false;
    }
  }
  
  return true;
}

async function test4_LockDay() {
  log('\n🔒 TEST 4: Lock Day', 'cyan');
  
  const response = await makeRequest(`${BASE_URL}/api/events/${eventId}/days/1/lock`, {
    method: 'POST',
    headers: {
      'X-ADMIN-TOKEN': adminToken
    }
  });

  if (response.status === 200 && response.body.success) {
    log('✅ Day 1 locked successfully', 'green');
    return true;
  }
  
  log('❌ Failed to lock day', 'red');
  return false;
}

async function test5_PublicScoreboard() {
  log('\n🏆 TEST 5: Public Scoreboard', 'cyan');
  
  const response = await makeRequest(`${BASE_URL}/events/${publicToken}`, {
    method: 'GET'
  });

  if (response.status === 200 && response.body.success) {
    const { event, teams, days, breakdown } = response.body.data;
    log(`✅ Event: ${event.name}`, 'green');
    log(`✅ Teams: ${teams.length}`, 'green');
    log(`✅ Days: ${days.length}`, 'green');
    log(`✅ Breakdown: ${Object.keys(breakdown).length} day(s)`, 'green');
    
    // Show team totals
    teams.forEach(team => {
      log(`   ${team.name}: ${team.total_points} points`, 'yellow');
    });
    
    return true;
  }
  
  log('❌ Failed to fetch scoreboard', 'red');
  return false;
}

async function test6_TokenValidation() {
  log('\n🔐 TEST 6: Token Validation', 'cyan');
  
  // Try to create team with wrong token
  const response = await makeRequest(`${BASE_URL}/api/events/${eventId}/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ADMIN-TOKEN': 'invalid-token-12345'
    },
    body: { name: 'Fake Team', color: '#000000' }
  });

  if (response.status === 403) {
    log('✅ Invalid token correctly rejected', 'green');
    return true;
  }
  
  log('❌ Security issue: Invalid token was accepted!', 'red');
  return false;
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 GAMESCORE BACKEND VERIFICATION TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  
  const tests = [
    test1_CreateEvent,
    test2_CreateTeams,
    test3_SubmitScores,
    test4_LockDay,
    test5_PublicScoreboard,
    test6_TokenValidation
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ Test crashed: ${error.message}`, 'red');
      failed++;
    }
  }

  log('\n' + '='.repeat(60), 'blue');
  log(`\n📊 TEST RESULTS`, 'blue');
  log(`   ✅ Passed: ${passed}`, 'green');
  log(`   ❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`, 'cyan');
  
  if (failed === 0) {
    log('🎉 ALL TESTS PASSED! Backend is fully operational.', 'green');
    process.exit(0);
  } else {
    log('⚠️  SOME TESTS FAILED. Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

// Check if server is running first
log('\n🔍 Checking if development server is running...', 'yellow');
makeRequest(`${BASE_URL}/api/health`)
  .then(() => {
    log('✅ Server is running!\n', 'green');
    runAllTests();
  })
  .catch(() => {
    log('❌ Server is NOT running!', 'red');
    log('\n💡 Start the server first:', 'yellow');
    log('   npm run dev\n', 'cyan');
    process.exit(1);
  });
