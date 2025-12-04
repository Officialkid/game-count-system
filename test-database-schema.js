#!/usr/bin/env node

/**
 * Database Schema Validation Test Suite
 * Tests all tables, queries, and data integrity constraints
 * 
 * Usage: node test-database-schema.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============================================
// TEST CONFIGURATION
// ============================================

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

let testsPassed = 0;
let testsFailed = 0;
const results = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'success');
    testsPassed++;
    results.push({ test: name, status: 'PASS' });
  } catch (error) {
    log(`✗ ${name}`, 'error');
    log(`  Error: ${error.message}`, 'error');
    testsFailed++;
    results.push({ test: name, status: 'FAIL', error: error.message });
  }
}

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// ============================================
// SCHEMA VALIDATION TESTS
// ============================================

async function testSchemaValidation() {
  log('\n=== SCHEMA VALIDATION TESTS ===\n', 'info');

  await test('Table: users exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'name', 'email', 'password_hash', 'created_at', 'email_verified', 'verification_token', 'failed_login_attempts', 'locked_until', 'last_login_at', 'last_login_ip'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: events exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'user_id', 'event_name', 'created_at', 'brand_color', 'logo_url', 'allow_negative', 'display_mode', 'num_teams'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: teams exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teams'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'event_id', 'team_name', 'avatar_url', 'total_points'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: game_scores exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'game_scores'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'event_id', 'team_id', 'game_number', 'points', 'created_at'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: share_links exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'share_links'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'event_id', 'token', 'created_at'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: refresh_tokens exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'refresh_tokens'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'user_id', 'token', 'expires_at', 'created_at', 'revoked'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: user_sessions exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_sessions'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'user_id', 'created_at', 'expires_at', 'is_active'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });

  await test('Table: audit_logs exists with correct columns', async () => {
    const result = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'audit_logs'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const required = ['id', 'user_id', 'event_type', 'event_status', 'ip_address', 'created_at'];
    
    required.forEach(col => {
      if (!columns.includes(col)) {
        throw new Error(`Missing column: ${col}`);
      }
    });
  });
}

// ============================================
// CONSTRAINTS & INDEXES TESTS
// ============================================

async function testConstraintsAndIndexes() {
  log('\n=== CONSTRAINTS & INDEXES TESTS ===\n', 'info');

  await test('Primary keys exist on all tables', async () => {
    const tables = ['users', 'events', 'teams', 'game_scores', 'share_links', 'refresh_tokens', 'user_sessions', 'audit_logs'];
    
    for (const table of tables) {
      const result = await query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = $1 AND constraint_type = 'PRIMARY KEY'
      `, [table]);
      
      if (result.rows.length === 0) {
        throw new Error(`No PRIMARY KEY on table: ${table}`);
      }
    }
  });

  await test('Foreign key: events.user_id -> users.id', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'events' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%fk%user%'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing foreign key on events.user_id');
    }
  });

  await test('Foreign key: teams.event_id -> events.id', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'teams' AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%fk%event%'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing foreign key on teams.event_id');
    }
  });

  await test('Foreign key: game_scores.team_id -> teams.id', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'game_scores' AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (result.rows.length < 2) {
      throw new Error('Missing foreign keys on game_scores');
    }
  });

  await test('Unique constraint: users.email is unique', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'users' AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%email%'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing unique constraint on users.email');
    }
  });

  await test('Unique constraint: share_links.token is unique', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'share_links' AND constraint_type = 'UNIQUE'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing unique constraint on share_links.token');
    }
  });

  await test('Index: idx_users_email exists', async () => {
    const result = await query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'users' AND indexname = 'idx_users_email'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing index: idx_users_email');
    }
  });

  await test('Index: idx_events_user_id exists', async () => {
    const result = await query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'events' AND indexname = 'idx_events_user_id'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing index: idx_events_user_id');
    }
  });

  await test('Index: idx_teams_event_id exists', async () => {
    const result = await query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'teams' AND indexname = 'idx_teams_event_id'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing index: idx_teams_event_id');
    }
  });

  await test('Index: idx_game_scores_team_id exists', async () => {
    const result = await query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'game_scores' AND indexname = 'idx_game_scores_team_id'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing index: idx_game_scores_team_id');
    }
  });

  await test('Index: idx_share_links_token exists', async () => {
    const result = await query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'share_links' AND indexname = 'idx_share_links_token'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing index: idx_share_links_token');
    }
  });

  await test('Check constraint: game_scores points in valid range', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'game_scores' AND constraint_type = 'CHECK'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Missing check constraint on game_scores.points');
    }
  });
}

// ============================================
// DATA INTEGRITY TESTS
// ============================================

async function testDataIntegrity() {
  log('\n=== DATA INTEGRITY TESTS ===\n', 'info');

  // Create test data
  let testUserId, testEventId, testTeamId;

  await test('Insert user and verify', async () => {
    const result = await query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, email
    `, ['Test User', `test-${Date.now()}@example.com`, 'hash123']);
    
    if (result.rows.length !== 1) {
      throw new Error('Failed to insert user');
    }
    testUserId = result.rows[0].id;
  });

  await test('Create event and verify ownership', async () => {
    const result = await query(`
      INSERT INTO events (user_id, event_name, brand_color)
      VALUES ($1, $2, $3)
      RETURNING id, user_id
    `, [testUserId, 'Test Event', '#6b46c1']);
    
    if (result.rows.length !== 1) {
      throw new Error('Failed to insert event');
    }
    if (result.rows[0].user_id !== testUserId) {
      throw new Error('Event ownership not properly assigned');
    }
    testEventId = result.rows[0].id;
  });

  await test('Create share link and verify', async () => {
    const token = `token_${Date.now()}`;
    const result = await query(`
      INSERT INTO share_links (event_id, token)
      VALUES ($1, $2)
      RETURNING id, event_id, token
    `, [testEventId, token]);
    
    if (result.rows.length !== 1) {
      throw new Error('Failed to insert share link');
    }
    if (result.rows[0].event_id !== testEventId) {
      throw new Error('Share link event_id mismatch');
    }
  });

  await test('Create team and verify event reference', async () => {
    const result = await query(`
      INSERT INTO teams (event_id, team_name)
      VALUES ($1, $2)
      RETURNING id, event_id
    `, [testEventId, 'Test Team']);
    
    if (result.rows.length !== 1) {
      throw new Error('Failed to insert team');
    }
    if (result.rows[0].event_id !== testEventId) {
      throw new Error('Team event_id mismatch');
    }
    testTeamId = result.rows[0].id;
  });

  await test('Add game score and verify references', async () => {
    const result = await query(`
      INSERT INTO game_scores (event_id, team_id, game_number, points)
      VALUES ($1, $2, $3, $4)
      RETURNING id, event_id, team_id
    `, [testEventId, testTeamId, 1, 50]);
    
    if (result.rows.length !== 1) {
      throw new Error('Failed to insert game score');
    }
    if (result.rows[0].event_id !== testEventId || result.rows[0].team_id !== testTeamId) {
      throw new Error('Game score references mismatch');
    }
  });

  await test('Verify cascade delete on event deletion', async () => {
    // Get counts before deletion
    const beforeTeams = await query('SELECT COUNT(*) as count FROM teams WHERE event_id = $1', [testEventId]);
    const beforeScores = await query('SELECT COUNT(*) as count FROM game_scores WHERE event_id = $1', [testEventId]);
    
    if (beforeTeams.rows[0].count === 0 || beforeScores.rows[0].count === 0) {
      throw new Error('Test data not created properly');
    }
    
    // Delete event
    await query('DELETE FROM events WHERE id = $1', [testEventId]);
    
    // Verify cascade
    const afterTeams = await query('SELECT COUNT(*) as count FROM teams WHERE event_id = $1', [testEventId]);
    const afterScores = await query('SELECT COUNT(*) as count FROM game_scores WHERE event_id = $1', [testEventId]);
    
    if (afterTeams.rows[0].count !== 0 || afterScores.rows[0].count !== 0) {
      throw new Error('Cascade delete failed');
    }
  });

  await test('Verify duplicate email constraint', async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    
    // Insert first user
    await query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
    `, ['User 1', email, 'hash']);
    
    // Try to insert duplicate
    try {
      await query(`
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
      `, ['User 2', email, 'hash']);
      throw new Error('Duplicate email was allowed');
    } catch (error) {
      if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
  });

  await test('Verify unique constraint on share_links.token', async () => {
    const userId = (await query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['User', `user-${Date.now()}@example.com`, 'hash'])).rows[0].id;
    
    const eventId = (await query(`
      INSERT INTO events (user_id, event_name)
      VALUES ($1, $2)
      RETURNING id
    `, [userId, 'Event'])).rows[0].id;
    
    const token = `token_${Date.now()}`;
    
    // Insert first share link
    await query(`
      INSERT INTO share_links (event_id, token)
      VALUES ($1, $2)
    `, [eventId, token]);
    
    // Try to insert duplicate token
    const event2Id = (await query(`
      INSERT INTO events (user_id, event_name)
      VALUES ($1, $2)
      RETURNING id
    `, [userId, 'Event 2'])).rows[0].id;
    
    try {
      await query(`
        INSERT INTO share_links (event_id, token)
        VALUES ($1, $2)
      `, [event2Id, token]);
      throw new Error('Duplicate token was allowed');
    } catch (error) {
      if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
  });
}

// ============================================
// QUERY VERIFICATION TESTS
// ============================================

async function testQueries() {
  log('\n=== QUERY VERIFICATION TESTS ===\n', 'info');

  // Create test data
  const userId = (await query(`
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id
  `, ['Query Test User', `query-test-${Date.now()}@example.com`, 'hash'])).rows[0].id;

  const eventId = (await query(`
    INSERT INTO events (user_id, event_name)
    VALUES ($1, $2)
    RETURNING id
  `, [userId, 'Query Test Event'])).rows[0].id;

  const teamId = (await query(`
    INSERT INTO teams (event_id, team_name)
    VALUES ($1, $2)
    RETURNING id
  `, [eventId, 'Query Test Team'])).rows[0].id;

  await test('Query: Find user by email', async () => {
    const email = `query-test-${Date.now()}@example.com`;
    
    await query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
    `, ['Test', email, 'hash']);
    
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to find user by email');
    }
  });

  await test('Query: List events by user', async () => {
    const result = await query(`
      SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to list events');
    }
  });

  await test('Query: Get teams for event', async () => {
    const result = await query(`
      SELECT id, team_name, total_points FROM teams WHERE event_id = $1
      ORDER BY total_points DESC, team_name ASC
    `, [eventId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to get teams');
    }
  });

  await test('Query: Get game scores for event', async () => {
    // Add some scores first
    await query(`
      INSERT INTO game_scores (event_id, team_id, game_number, points)
      VALUES ($1, $2, $3, $4)
    `, [eventId, teamId, 1, 50]);

    const result = await query(`
      SELECT gs.id, gs.game_number, gs.points, t.team_name
      FROM game_scores gs
      JOIN teams t ON gs.team_id = t.id
      WHERE gs.event_id = $1
      ORDER BY gs.game_number ASC
    `, [eventId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to get game scores');
    }
  });

  await test('Query: Find share link by token', async () => {
    const token = `query-token-${Date.now()}`;
    
    await query(`
      INSERT INTO share_links (event_id, token)
      VALUES ($1, $2)
    `, [eventId, token]);
    
    const result = await query('SELECT * FROM share_links WHERE token = $1', [token]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to find share link by token');
    }
  });

  await test('Query: Get public scoreboard data', async () => {
    const result = await query(`
      SELECT 
        e.id, e.event_name, e.created_at,
        COUNT(DISTINCT t.id) as team_count
      FROM events e
      LEFT JOIN teams t ON e.id = t.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `, [eventId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to get public scoreboard');
    }
  });

  await test('Query: Join teams with scores', async () => {
    const result = await query(`
      SELECT 
        t.id, t.team_name, COUNT(gs.id) as score_count
      FROM teams t
      LEFT JOIN game_scores gs ON t.id = gs.team_id
      WHERE t.event_id = $1
      GROUP BY t.id, t.team_name
    `, [eventId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to join teams with scores');
    }
  });
}

// ============================================
// AUTHENTICATION TABLES TESTS
// ============================================

async function testAuthenticationTables() {
  log('\n=== AUTHENTICATION TABLES TESTS ===\n', 'info');

  let testUserId;

  await test('Create user for auth tests', async () => {
    const result = await query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id
    `, ['Auth Test User', `auth-test-${Date.now()}@example.com`, 'hash']);
    
    testUserId = result.rows[0].id;
  });

  await test('Create refresh token', async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const result = await query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at
    `, [testUserId, `token_${Date.now()}`, expiresAt.toISOString()]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create refresh token');
    }
  });

  await test('Find valid refresh token', async () => {
    const token = `token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at, revoked)
      VALUES ($1, $2, $3, $4)
    `, [testUserId, token, expiresAt.toISOString(), false]);
    
    const result = await query(`
      SELECT * FROM refresh_tokens
      WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()
    `, [token]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to find valid refresh token');
    }
  });

  await test('Revoke refresh token', async () => {
    const token = `token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const insertResult = await query(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [testUserId, token, expiresAt.toISOString()]);
    
    const tokenId = insertResult.rows[0].id;
    
    // Revoke it
    await query(`
      UPDATE refresh_tokens
      SET revoked = TRUE, revoked_at = NOW()
      WHERE id = $1
    `, [tokenId]);
    
    // Verify it's revoked
    const result = await query(`
      SELECT revoked FROM refresh_tokens WHERE id = $1
    `, [tokenId]);
    
    if (!result.rows[0].revoked) {
      throw new Error('Failed to revoke refresh token');
    }
  });

  await test('Create user session', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const result = await query(`
      INSERT INTO user_sessions (user_id, expires_at, is_active)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, is_active
    `, [testUserId, expiresAt.toISOString(), true]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create session');
    }
  });

  await test('Create audit log', async () => {
    const result = await query(`
      INSERT INTO audit_logs (user_id, event_type, event_status)
      VALUES ($1, $2, $3)
      RETURNING id, event_type, event_status
    `, [testUserId, 'login_attempt', 'success']);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create audit log');
    }
  });

  await test('Query audit logs for user', async () => {
    const result = await query(`
      SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC
    `, [testUserId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to query audit logs');
    }
  });

  await test('Update last login', async () => {
    const result = await query(`
      UPDATE users
      SET last_login_at = NOW(), last_login_ip = $1
      WHERE id = $2
      RETURNING last_login_at
    `, ['192.168.1.1', testUserId]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update last login');
    }
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════╗', 'info');
  log('║    DATABASE SCHEMA VALIDATION TEST SUITE              ║', 'info');
  log('║    Testing all tables and queries                     ║', 'info');
  log('╚═══════════════════════════════════════════════════════╝', 'info');

  try {
    await testSchemaValidation();
    await testConstraintsAndIndexes();
    await testDataIntegrity();
    await testQueries();
    await testAuthenticationTables();

    // Print summary
    log('\n=== TEST SUMMARY ===\n', 'info');
    log(`✓ Tests Passed: ${testsPassed}`, 'success');
    log(`✗ Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
    log(`Total Tests: ${testsPassed + testsFailed}\n`, 'info');

    // Print detailed results
    log('=== DETAILED RESULTS ===\n', 'info');
    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✓' : '✗';
      const color = r.status === 'PASS' ? 'success' : 'error';
      log(`${icon} ${r.test} - ${r.status}`, color);
      if (r.error) {
        log(`  └─ ${r.error}`, 'error');
      }
    });

    if (testsFailed === 0) {
      log('\n✓ All tests passed! Schema is correct.', 'success');
      process.exit(0);
    } else {
      log('\n✗ Some tests failed. Please review the errors above.', 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
runAllTests();
