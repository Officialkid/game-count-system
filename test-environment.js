#!/usr/bin/env node

/**
 * ENVIRONMENT VALIDATION TEST
 * Tests all required environment variables for deployment
 * 
 * Usage: node test-environment.js
 */

require('dotenv').config();
const { Pool } = require('pg');

let testsPassed = 0;
let testsFailed = 0;
const issues = [];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'success');
    testsPassed++;
  } catch (error) {
    log(`✗ ${name}`, 'error');
    log(`  Error: ${error.message}`, 'error');
    testsFailed++;
    issues.push({ test: name, error: error.message });
  }
}

// ============================================
// TEST SUITE: ENVIRONMENT VARIABLES
// ============================================

async function testEnvironmentVariables() {
  log('\n═══════════════════════════════════════════════', 'info');
  log('ENVIRONMENT VALIDATION TEST', 'info');
  log('═══════════════════════════════════════════════\n', 'info');

  log('=== TESTING REQUIRED ENVIRONMENT VARIABLES ===\n', 'info');

  // 1. POSTGRES_URL
  await test('POSTGRES_URL is defined', async () => {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL is not defined in .env file');
    }
  });

  await test('POSTGRES_URL has correct format', async () => {
    const url = process.env.POSTGRES_URL;
    if (!url) throw new Error('POSTGRES_URL not defined');
    
    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
      throw new Error('POSTGRES_URL must start with postgres:// or postgresql://');
    }
    
    // Check for required components
    if (!url.includes('@')) throw new Error('POSTGRES_URL missing credentials (@)');
    if (!url.includes(':')) throw new Error('POSTGRES_URL missing port (:)');
  });

  await test('POSTGRES_URL connection works', async () => {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    try {
      const result = await pool.query('SELECT NOW() as time, version() as version');
      if (!result.rows[0]) throw new Error('No response from database');
      log(`  → Connected to PostgreSQL: ${result.rows[0].version.split(',')[0]}`, 'info');
    } finally {
      await pool.end();
    }
  });

  // 2. JWT_SECRET
  await test('JWT_SECRET is defined', async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env file');
    }
  });

  await test('JWT_SECRET has minimum length (32 chars)', async () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');
    
    if (secret.length < 32) {
      throw new Error(`JWT_SECRET too short (${secret.length} chars). Minimum: 32 chars for security`);
    }
    log(`  → JWT_SECRET length: ${secret.length} characters`, 'info');
  });

  await test('JWT_SECRET is not default/weak value', async () => {
    const secret = process.env.JWT_SECRET;
    const weakSecrets = ['secret', 'password', '12345', 'test', 'dev', 'development'];
    
    if (weakSecrets.some(weak => secret.toLowerCase().includes(weak))) {
      throw new Error('JWT_SECRET appears to be a weak/default value');
    }
  });

  // 3. NEXT_PUBLIC_URL
  await test('NEXT_PUBLIC_URL is defined', async () => {
    if (!process.env.NEXT_PUBLIC_URL) {
      throw new Error('NEXT_PUBLIC_URL is not defined in .env file');
    }
  });

  await test('NEXT_PUBLIC_URL has correct format', async () => {
    const url = process.env.NEXT_PUBLIC_URL;
    if (!url) throw new Error('NEXT_PUBLIC_URL not defined');
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('NEXT_PUBLIC_URL must start with http:// or https://');
    }
    
    // Production should use https
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      log(`  ⚠ Using localhost URL (dev mode)`, 'warning');
    } else if (url.startsWith('http://')) {
      log(`  ⚠ Production URL should use HTTPS`, 'warning');
      issues.push({ test: 'NEXT_PUBLIC_URL SSL', error: 'Should use HTTPS in production' });
    }
    
    log(`  → App URL: ${url}`, 'info');
  });

  // 4. COOKIE_SECRET
  await test('COOKIE_SECRET is defined', async () => {
    if (!process.env.COOKIE_SECRET) {
      throw new Error('COOKIE_SECRET is not defined in .env file');
    }
  });

  await test('COOKIE_SECRET has minimum length (32 chars)', async () => {
    const secret = process.env.COOKIE_SECRET;
    if (!secret) throw new Error('COOKIE_SECRET not defined');
    
    if (secret.length < 32) {
      throw new Error(`COOKIE_SECRET too short (${secret.length} chars). Minimum: 32 chars for security`);
    }
    log(`  → COOKIE_SECRET length: ${secret.length} characters`, 'info');
  });

  await test('COOKIE_SECRET differs from JWT_SECRET', async () => {
    const jwtSecret = process.env.JWT_SECRET;
    const cookieSecret = process.env.COOKIE_SECRET;
    
    if (jwtSecret === cookieSecret) {
      throw new Error('COOKIE_SECRET should be different from JWT_SECRET for security');
    }
  });

  // 5. EMAIL_SMTP credentials
  log('\n=== TESTING EMAIL SMTP CONFIGURATION ===\n', 'info');

  await test('EMAIL_SERVER is defined', async () => {
    if (!process.env.EMAIL_SERVER) {
      throw new Error('EMAIL_SERVER is not defined in .env file');
    }
  });

  await test('EMAIL_SERVER has correct format', async () => {
    const server = process.env.EMAIL_SERVER;
    if (!server) throw new Error('EMAIL_SERVER not defined');
    
    // Should be hostname or IP
    if (server.includes('://')) {
      throw new Error('EMAIL_SERVER should be hostname only (no protocol)');
    }
    log(`  → SMTP Server: ${server}`, 'info');
  });

  await test('EMAIL_PORT is defined and valid', async () => {
    if (!process.env.EMAIL_PORT) {
      throw new Error('EMAIL_PORT is not defined in .env file');
    }
    
    const port = parseInt(process.env.EMAIL_PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`EMAIL_PORT must be a valid port number (1-65535), got: ${process.env.EMAIL_PORT}`);
    }
    
    // Common SMTP ports
    const commonPorts = [25, 465, 587, 2525];
    if (!commonPorts.includes(port)) {
      log(`  ⚠ Unusual SMTP port: ${port} (common: 25, 465, 587, 2525)`, 'warning');
    } else {
      log(`  → SMTP Port: ${port}`, 'info');
    }
  });

  await test('EMAIL_USER is defined', async () => {
    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER is not defined in .env file');
    }
    log(`  → Email User: ${process.env.EMAIL_USER}`, 'info');
  });

  await test('EMAIL_PASSWORD is defined', async () => {
    if (!process.env.EMAIL_PASSWORD) {
      throw new Error('EMAIL_PASSWORD is not defined in .env file');
    }
    log(`  → Email Password: ${'*'.repeat(process.env.EMAIL_PASSWORD.length)} (hidden)`, 'info');
  });

  await test('EMAIL_FROM is defined and valid', async () => {
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM is not defined in .env file');
    }
    
    const from = process.env.EMAIL_FROM;
    // Basic email validation
    if (!from.includes('@') || !from.includes('.')) {
      throw new Error(`EMAIL_FROM appears invalid: ${from}`);
    }
    log(`  → From Address: ${from}`, 'info');
  });

  await test('EMAIL_SECURE is defined and boolean', async () => {
    const secure = process.env.EMAIL_SECURE;
    if (secure === undefined || secure === null || secure === '') {
      throw new Error('EMAIL_SECURE is not defined in .env file');
    }
    
    if (secure !== 'true' && secure !== 'false') {
      throw new Error(`EMAIL_SECURE must be 'true' or 'false', got: ${secure}`);
    }
    
    const port = parseInt(process.env.EMAIL_PORT);
    if (secure === 'true' && port === 587) {
      log(`  ⚠ Port 587 typically uses STARTTLS (secure=false), not SSL (secure=true)`, 'warning');
    }
    
    log(`  → SSL/TLS: ${secure === 'true' ? 'Enabled' : 'Disabled (STARTTLS)'}`, 'info');
  });

  // 6. Optional but recommended
  log('\n=== TESTING OPTIONAL ENVIRONMENT VARIABLES ===\n', 'info');

  await test('NODE_ENV is defined', async () => {
    if (!process.env.NODE_ENV) {
      log(`  ⚠ NODE_ENV not defined (defaulting to development)`, 'warning');
      issues.push({ test: 'NODE_ENV', error: 'Should be set to "production" for deployment' });
      throw new Error('NODE_ENV not defined');
    }
    log(`  → Environment: ${process.env.NODE_ENV}`, 'info');
  });

  await test('NODE_ENV is production for deployment', async () => {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv !== 'production') {
      log(`  ⚠ NODE_ENV is "${nodeEnv}" (should be "production" for deployment)`, 'warning');
      issues.push({ test: 'NODE_ENV value', error: 'Should be "production" for deployment' });
    }
  });
}

// ============================================
// TEST SUITE: SECURITY CHECKS
// ============================================

async function testSecurityConfiguration() {
  log('\n=== TESTING SECURITY CONFIGURATION ===\n', 'info');

  await test('Secrets are not committed to repository', async () => {
    const fs = require('fs');
    const path = require('path');
    
    // Check if .env is in .gitignore
    const gitignorePath = path.join(__dirname, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      throw new Error('.gitignore file not found');
    }
    
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('.env')) {
      throw new Error('.env is not listed in .gitignore - secrets may be committed!');
    }
  });

  await test('Production uses strong secrets', async () => {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      const jwtSecret = process.env.JWT_SECRET || '';
      const cookieSecret = process.env.COOKIE_SECRET || '';
      
      // Check for randomness (should have mix of chars)
      const hasNumbers = /\d/.test(jwtSecret);
      const hasLetters = /[a-zA-Z]/.test(jwtSecret);
      const hasSpecial = /[^a-zA-Z0-9]/.test(jwtSecret);
      
      if (!hasNumbers || !hasLetters) {
        log(`  ⚠ JWT_SECRET should contain mix of letters and numbers`, 'warning');
      }
      if (!hasSpecial) {
        log(`  ⚠ JWT_SECRET should contain special characters for extra security`, 'warning');
      }
    }
  });

  await test('Database connection uses SSL', async () => {
    const url = process.env.POSTGRES_URL || '';
    
    // Check if SSL is configured in connection string
    if (!url.includes('sslmode=') && !url.includes('ssl=')) {
      log(`  ℹ SSL mode not specified in POSTGRES_URL (using default)`, 'info');
    }
    
    // Test actual SSL connection
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await pool.query('SELECT 1');
      log(`  → Database connection uses SSL`, 'info');
    } finally {
      await pool.end();
    }
  });
}

// ============================================
// TEST SUITE: DATABASE VALIDATION
// ============================================

async function testDatabaseConfiguration() {
  log('\n=== TESTING DATABASE CONFIGURATION ===\n', 'info');

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await test('Database has required tables', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tables = result.rows.map(r => r.table_name);
      const required = ['users', 'events', 'teams', 'game_scores', 'share_links', 
                       'refresh_tokens', 'user_sessions', 'audit_logs'];
      
      const missing = required.filter(t => !tables.includes(t));
      if (missing.length > 0) {
        throw new Error(`Missing tables: ${missing.join(', ')}`);
      }
      
      log(`  → Found ${tables.length} tables: ${tables.join(', ')}`, 'info');
    });

    await test('Database has required indexes', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY indexname
      `);
      
      const indexes = result.rows.map(r => r.indexname);
      const criticalIndexes = [
        'idx_users_email',
        'idx_events_user_id',
        'idx_teams_event_id',
        'idx_game_scores_event_id'
      ];
      
      const missing = criticalIndexes.filter(i => !indexes.includes(i));
      if (missing.length > 0) {
        throw new Error(`Missing critical indexes: ${missing.join(', ')}`);
      }
      
      log(`  → Found ${indexes.length} indexes`, 'info');
    });

    await test('Database has required functions/triggers', async () => {
      const result = await pool.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
      `);
      
      const functions = result.rows.map(r => r.proname);
      const required = ['recalculate_team_total_points', 'cleanup_expired_tokens'];
      
      const missing = required.filter(f => !functions.includes(f));
      if (missing.length > 0) {
        throw new Error(`Missing functions: ${missing.join(', ')}`);
      }
      
      log(`  → Required functions present`, 'info');
    });

  } finally {
    await pool.end();
  }
}

// ============================================
// TEST SUITE: CONNECTIVITY
// ============================================

async function testConnectivity() {
  log('\n=== TESTING CONNECTIVITY & PERFORMANCE ===\n', 'info');

  await test('Database query performance', async () => {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const start = performance.now();
      await pool.query('SELECT 1');
      const duration = performance.now() - start;
      
      if (duration > 1000) {
        log(`  ⚠ Database response slow: ${duration.toFixed(0)}ms`, 'warning');
      } else {
        log(`  → Database response time: ${duration.toFixed(0)}ms`, 'info');
      }
    } finally {
      await pool.end();
    }
  });

  await test('Database connection pool works', async () => {
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 5
    });

    try {
      // Test multiple concurrent connections
      const promises = Array(5).fill(0).map((_, i) => 
        pool.query('SELECT $1 as num', [i])
      );
      
      await Promise.all(promises);
      log(`  → Connection pool handling ${promises.length} concurrent queries`, 'info');
    } finally {
      await pool.end();
    }
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          ENVIRONMENT & DEPLOYMENT VALIDATION TEST              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    await testEnvironmentVariables();
    await testSecurityConfiguration();
    await testDatabaseConfiguration();
    await testConnectivity();

    // Print summary
    printSummary();
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

function printSummary() {
  const total = testsPassed + testsFailed;
  const successRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         TEST SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  log(`Tests Passed:  ${testsPassed}`, 'success');
  log(`Tests Failed:  ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
  log(`Total Tests:   ${total}`, 'info');
  log(`Success Rate:  ${successRate}%\n`, successRate >= 90 ? 'success' : 'warning');

  if (testsFailed > 0) {
    log('FAILED TESTS:\n', 'error');
    issues
      .filter(i => i.test && i.error)
      .forEach(i => {
        log(`✗ ${i.test}`, 'error');
        log(`  ${i.error}`, 'error');
      });
  }

  // Deployment readiness
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    DEPLOYMENT READINESS                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (testsFailed === 0 && issues.length === 0) {
    log('✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT!', 'success');
  } else if (testsFailed === 0) {
    log('⚠️  ALL REQUIRED CHECKS PASSED - WARNINGS PRESENT', 'warning');
    log('Review warnings before deploying to production', 'warning');
  } else {
    log('❌ DEPLOYMENT BLOCKED - FIX FAILED TESTS', 'error');
  }

  console.log('');

  // Environment summary
  console.log('Environment Configuration:');
  console.log(`  Database: ${process.env.POSTGRES_URL ? '✓' : '✗'} Configured`);
  console.log(`  JWT Auth: ${process.env.JWT_SECRET ? '✓' : '✗'} Configured`);
  console.log(`  App URL:  ${process.env.NEXT_PUBLIC_URL || 'Not set'}`);
  console.log(`  Cookies:  ${process.env.COOKIE_SECRET ? '✓' : '✗'} Configured`);
  console.log(`  Email:    ${process.env.EMAIL_SERVER ? '✓' : '✗'} Configured`);
  console.log(`  Node Env: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
