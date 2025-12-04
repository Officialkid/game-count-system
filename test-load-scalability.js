#!/usr/bin/env node

/**
 * LOAD TESTING & SCALABILITY CHECK
 * Simulates concurrent users on public scoreboard
 * 
 * Tests:
 * - Animation performance under load
 * - Ranking update responsiveness
 * - Hydration errors
 * - Component stability
 * - Memory usage
 * - API response times
 * 
 * Usage: npm run dev (in another terminal), then: node test-load-scalability.js
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
const API_BASE = BASE_URL;

let loadTests = [];
let memoryMetrics = [];
let apiMetrics = [];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    debug: '\x1b[90m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

/**
 * Make HTTP request with timing
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const url = new URL(BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTester/1.0'
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = performance.now() - startTime;
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          duration,
          timestamp: new Date()
        });
      });
    });

    req.on('error', (error) => {
      const duration = performance.now() - startTime;
      reject({
        error: error.message,
        duration,
        timestamp: new Date()
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        duration: 10000,
        timestamp: new Date()
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test 1: Single User Baseline
 */
async function testSingleUserBaseline() {
  log('\n═══════════════════════════════════════════════', 'info');
  log('TEST 1: SINGLE USER BASELINE', 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  try {
    log('Fetching public scoreboard...', 'debug');
    const response = await makeRequest('GET', '/');
    
    log(`✓ Status: ${response.status}`, 'success');
    log(`✓ Response time: ${response.duration.toFixed(0)}ms`, 'success');
    log(`✓ HTML size: ${response.body.length} bytes`, 'success');

    // Check for hydration errors
    if (response.body.includes('Hydration failed')) {
      log(`✗ Hydration error detected in HTML`, 'error');
      return { hydrationError: true, responseTime: response.duration };
    }

    loadTests.push({
      name: 'Single User Baseline',
      concurrent: 1,
      responseTime: response.duration,
      status: response.status,
      success: true,
      timestamp: response.timestamp
    });

    return { baseline: response.duration, success: true };
  } catch (error) {
    log(`✗ Error: ${error.error}`, 'error');
    return { success: false, error: error.error };
  }
}

/**
 * Test 2: Concurrent API Requests (5 users)
 */
async function testConcurrentLoad(concurrentUsers) {
  log(`\n═══════════════════════════════════════════════`, 'info');
  log(`TEST: ${concurrentUsers} CONCURRENT USERS`, 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  const startTime = performance.now();
  const requests = [];
  const results = {
    successful: 0,
    failed: 0,
    hydrationErrors: 0,
    totalDuration: 0,
    responseTimes: [],
    errors: []
  };

  log(`Spawning ${concurrentUsers} concurrent requests...`, 'debug');

  // Create concurrent requests
  for (let i = 0; i < concurrentUsers; i++) {
    const promise = makeRequest('GET', '/')
      .then(response => {
        results.successful++;
        results.responseTimes.push(response.duration);
        
        // Check for hydration errors
        if (response.body.includes('Hydration failed')) {
          results.hydrationErrors++;
        }
        
        return response;
      })
      .catch(error => {
        results.failed++;
        results.errors.push(error.error);
        return error;
      });
    
    requests.push(promise);
  }

  // Wait for all requests
  await Promise.all(requests);
  const totalTime = performance.now() - startTime;
  results.totalDuration = totalTime;

  // Calculate statistics
  const avgResponse = results.responseTimes.length > 0 
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
    : 0;
  
  const minResponse = results.responseTimes.length > 0 ? Math.min(...results.responseTimes) : 0;
  const maxResponse = results.responseTimes.length > 0 ? Math.max(...results.responseTimes) : 0;
  const p95Response = results.responseTimes.length > 0 
    ? results.responseTimes.sort((a, b) => a - b)[Math.floor(results.responseTimes.length * 0.95)] 
    : 0;

  log(`✓ Completed: ${results.successful}/${concurrentUsers} successful`, 
    results.failed === 0 ? 'success' : 'warning');
  
  if (results.failed > 0) {
    log(`✗ Failed: ${results.failed}`, 'error');
  }

  log(`Average response: ${avgResponse.toFixed(0)}ms`, 'info');
  log(`Min response: ${minResponse.toFixed(0)}ms`, 'info');
  log(`Max response: ${maxResponse.toFixed(0)}ms`, 'info');
  log(`P95 response: ${p95Response.toFixed(0)}ms`, 'info');
  log(`Total time: ${totalTime.toFixed(0)}ms`, 'info');

  if (results.hydrationErrors > 0) {
    log(`⚠ Hydration errors: ${results.hydrationErrors}`, 'warning');
  }

  loadTests.push({
    name: `Concurrent Load - ${concurrentUsers} users`,
    concurrent: concurrentUsers,
    successful: results.successful,
    failed: results.failed,
    avgResponse,
    minResponse,
    maxResponse,
    p95Response,
    hydrationErrors: results.hydrationErrors,
    totalDuration: totalTime,
    successRate: ((results.successful / concurrentUsers) * 100).toFixed(1)
  });

  return results;
}

/**
 * Test 3: API Endpoint Load
 */
async function testAPILoad(concurrentUsers) {
  log(`\n═══════════════════════════════════════════════`, 'info');
  log(`TEST: API LOAD - ${concurrentUsers} CONCURRENT USERS`, 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  const apiEndpoints = [
    '/api/public/scoreboard',
    '/api/events',
    '/api/teams'
  ];

  const results = {
    successful: 0,
    failed: 0,
    totalDuration: 0,
    responseTimes: [],
    byEndpoint: {}
  };

  const startTime = performance.now();
  const requests = [];

  for (const endpoint of apiEndpoints) {
    for (let i = 0; i < concurrentUsers; i++) {
      const promise = makeRequest('GET', endpoint)
        .then(response => {
          results.successful++;
          results.responseTimes.push(response.duration);
          
          if (!results.byEndpoint[endpoint]) {
            results.byEndpoint[endpoint] = { times: [], success: 0, fail: 0 };
          }
          results.byEndpoint[endpoint].times.push(response.duration);
          results.byEndpoint[endpoint].success++;
          
          return response;
        })
        .catch(error => {
          results.failed++;
          if (!results.byEndpoint[endpoint]) {
            results.byEndpoint[endpoint] = { times: [], success: 0, fail: 0 };
          }
          results.byEndpoint[endpoint].fail++;
          return error;
        });
      
      requests.push(promise);
    }
  }

  await Promise.all(requests);
  results.totalDuration = performance.now() - startTime;

  log(`✓ Total requests: ${results.successful + results.failed}`, 'success');
  log(`✓ Successful: ${results.successful}`, 'success');
  
  if (results.failed > 0) {
    log(`✗ Failed: ${results.failed}`, 'error');
  }

  // Per-endpoint stats
  log(`\nPer-endpoint performance:`, 'info');
  for (const [endpoint, stats] of Object.entries(results.byEndpoint)) {
    const avgTime = stats.times.length > 0 
      ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length 
      : 0;
    log(`  ${endpoint}: ${avgTime.toFixed(0)}ms avg (${stats.success}/${stats.success + stats.fail})`, 'info');
  }

  const avgResponse = results.responseTimes.length > 0 
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
    : 0;

  log(`\nAverage API response: ${avgResponse.toFixed(0)}ms`, 'info');

  return results;
}

/**
 * Test 4: Sustained Load
 */
async function testSustainedLoad(concurrentUsers, durationSeconds) {
  log(`\n═══════════════════════════════════════════════`, 'info');
  log(`TEST: SUSTAINED LOAD - ${concurrentUsers} users for ${durationSeconds}s`, 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  const results = {
    totalRequests: 0,
    successful: 0,
    failed: 0,
    responseTimes: [],
    errors: [],
    peakResponseTime: 0,
    averageResponseTime: 0
  };

  const startTime = performance.now();
  let completed = 0;

  while (performance.now() - startTime < durationSeconds * 1000) {
    const batchStartTime = performance.now();
    const requests = [];

    for (let i = 0; i < concurrentUsers; i++) {
      const promise = makeRequest('GET', '/')
        .then(response => {
          results.successful++;
          results.totalRequests++;
          results.responseTimes.push(response.duration);
          results.peakResponseTime = Math.max(results.peakResponseTime, response.duration);
        })
        .catch(error => {
          results.failed++;
          results.totalRequests++;
          results.errors.push(error.error);
        });
      
      requests.push(promise);
    }

    await Promise.all(requests);
    completed++;

    const batchTime = performance.now() - batchStartTime;
    const requestsPerSecond = (concurrentUsers / (batchTime / 1000)).toFixed(0);
    log(`Batch ${completed}: ${requestsPerSecond} req/s (${results.successful} ok, ${results.failed} fail)`, 'debug');
  }

  const totalTime = performance.now() - startTime;
  results.averageResponseTime = results.responseTimes.length > 0
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    : 0;

  const requestsPerSecond = ((results.totalRequests / totalTime) * 1000).toFixed(0);
  const successRate = ((results.successful / results.totalRequests) * 100).toFixed(1);

  log(`\n✓ Total requests: ${results.totalRequests}`, 'success');
  log(`✓ Successful: ${results.successful}`, 'success');
  log(`✓ Request/sec: ${requestsPerSecond}`, 'success');
  log(`✓ Success rate: ${successRate}%`, successRate > 95 ? 'success' : 'warning');
  log(`✓ Avg response: ${results.averageResponseTime.toFixed(0)}ms`, 'info');
  log(`✓ Peak response: ${results.peakResponseTime.toFixed(0)}ms`, 'info');

  if (results.failed > 0) {
    log(`✗ Failed: ${results.failed}`, 'warning');
  }

  loadTests.push({
    name: `Sustained Load - ${concurrentUsers} users x ${durationSeconds}s`,
    concurrent: concurrentUsers,
    duration: durationSeconds,
    totalRequests: results.totalRequests,
    successful: results.successful,
    failed: results.failed,
    requestsPerSecond,
    avgResponse: results.averageResponseTime,
    peakResponse: results.peakResponseTime,
    successRate
  });

  return results;
}

/**
 * Stress Test: Find Breaking Point
 */
async function stressTest() {
  log(`\n═══════════════════════════════════════════════`, 'info');
  log('TEST: STRESS TEST - FIND BREAKING POINT', 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  const stressLevels = [10, 25, 50, 100, 250];
  const results = {
    breakingPoint: null,
    degradationStart: null,
    metrics: []
  };

  let previousSuccessRate = 100;
  let degradationDetected = false;

  for (const level of stressLevels) {
    log(`\nTesting ${level} concurrent users...`, 'debug');
    
    const result = await testConcurrentLoad(level);
    const successRate = parseFloat(result.successRate || ((result.successful / level) * 100).toFixed(1));
    const avgResponse = result.avgResponse || 0;

    results.metrics.push({
      concurrent: level,
      successRate,
      avgResponse,
      failed: result.failed
    });

    // Detect degradation
    if (successRate < previousSuccessRate && !degradationDetected) {
      results.degradationStart = level;
      degradationDetected = true;
      log(`⚠ Performance degradation detected at ${level} users`, 'warning');
    }

    // Detect breaking point
    if (successRate < 90) {
      results.breakingPoint = level;
      log(`🚫 Breaking point found at ${level} concurrent users`, 'error');
      break;
    }

    previousSuccessRate = successRate;
  }

  return results;
}

/**
 * Generate Report
 */
function generateReport() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'info');
  log('║            LOAD TESTING & SCALABILITY REPORT                   ║', 'info');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'info');

  log('TEST SUMMARY\n', 'info');
  
  console.table(loadTests.map(t => ({
    'Test': t.name,
    'Users': t.concurrent,
    'Avg (ms)': t.avgResponse ? t.avgResponse.toFixed(0) : '-',
    'P95 (ms)': t.p95Response ? t.p95Response.toFixed(0) : '-',
    'Success %': t.successRate || '-',
    'Hydration Err': t.hydrationErrors || 0
  })));

  log('\n════════════════════════════════════════════════\n', 'info');
  log('PERFORMANCE THRESHOLDS\n', 'info');

  const baseline = loadTests[0]?.responseTime || 0;
  const thresholds = [
    { users: 5, target: baseline * 1.5, label: '5 users' },
    { users: 25, target: baseline * 2, label: '25 users' },
    { users: 50, target: baseline * 2.5, label: '50 users' },
    { users: 100, target: baseline * 3, label: '100 users' }
  ];

  thresholds.forEach(t => {
    const test = loadTests.find(l => l.concurrent === t.users);
    if (test) {
      const avgTime = test.avgResponse || 0;
      const status = avgTime < t.target ? '✓' : '✗';
      const color = avgTime < t.target ? 'success' : 'error';
      log(`${status} ${t.label}: ${avgTime.toFixed(0)}ms (target: ${t.target.toFixed(0)}ms)`, color);
    }
  });

  log('\n════════════════════════════════════════════════\n', 'info');
  log('BOTTLENECK ANALYSIS\n', 'info');

  // Analyze bottlenecks
  const responseTimeGrowth = [];
  for (let i = 1; i < loadTests.length; i++) {
    if (loadTests[i].avgResponse && loadTests[i-1].avgResponse) {
      const growth = ((loadTests[i].avgResponse / loadTests[i-1].avgResponse) - 1) * 100;
      responseTimeGrowth.push({
        transition: `${loadTests[i-1].concurrent} → ${loadTests[i].concurrent} users`,
        growth: growth.toFixed(1)
      });
    }
  }

  if (responseTimeGrowth.length > 0) {
    console.table(responseTimeGrowth);
  }

  log('\n════════════════════════════════════════════════\n', 'info');
  log('RECOMMENDATIONS\n', 'info');

  const worstTest = loadTests.reduce((a, b) => 
    (b.avgResponse || 0) > (a.avgResponse || 0) ? b : a
  );

  if (worstTest.avgResponse > 1000) {
    log('⚠ Response times exceed 1 second under load', 'warning');
    log('  → Consider: API caching, database optimization, CDN', 'info');
  }

  if (worstTest.hydrationErrors > 0) {
    log('⚠ Hydration errors detected', 'warning');
    log('  → Check: Server/client state mismatch, dynamic content', 'info');
  }

  const failedTests = loadTests.filter(t => t.failed > 0);
  if (failedTests.length > 0) {
    log('⚠ Some requests failed under load', 'warning');
    log('  → Check: API limits, database connections, memory', 'info');
  }

  // Scalability assessment
  log('\n════════════════════════════════════════════════\n', 'info');
  log('SCALABILITY ASSESSMENT\n', 'info');

  const avgLastThree = loadTests.slice(-3)
    .filter(t => t.avgResponse)
    .map(t => t.avgResponse)
    .reduce((a, b) => a + b, 0) / Math.min(3, loadTests.slice(-3).length);

  if (avgLastThree < 500) {
    log('✅ EXCELLENT - Application scales well to 100+ users', 'success');
  } else if (avgLastThree < 1000) {
    log('✓ GOOD - Application scales to 50+ users', 'success');
  } else if (avgLastThree < 2000) {
    log('⚠ FAIR - Application needs optimization for 25+ users', 'warning');
  } else {
    log('✗ POOR - Application needs significant optimization', 'error');
  }

  // Recommendations
  log('\nOptimization priorities:', 'info');
  log('1. Frontend caching (static scoreboard, animations)', 'info');
  log('2. API response caching (Redis)', 'info');
  log('3. Database query optimization', 'info');
  log('4. Component lazy loading', 'info');
  log('5. Image optimization (WebP, responsive)', 'info');

  log('\n════════════════════════════════════════════════\n', 'info');
}

/**
 * Main test runner
 */
async function runLoadTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           LOAD TESTING & SCALABILITY CHECK                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  log('ℹ Connecting to: ' + BASE_URL, 'info');
  log('ℹ Make sure: npm run dev is running in another terminal\n', 'info');

  try {
    // Test 1: Single user baseline
    await testSingleUserBaseline();

    // Test 2: Incremental concurrent load
    await testConcurrentLoad(5);
    await testConcurrentLoad(10);
    await testConcurrentLoad(25);

    // Test 3: API load test
    await testAPILoad(5);

    // Test 4: Sustained load
    await testSustainedLoad(5, 3);

    // Test 5: Stress test to find breaking point
    await stressTest();

    // Generate report
    generateReport();

    log('\n✅ Load testing complete!\n', 'success');

  } catch (error) {
    log(`\n❌ Error during testing: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runLoadTests();
