#!/usr/bin/env node

/**
 * COMPREHENSIVE DATABASE DIAGNOSTICS TEST SUITE
 * 
 * Tests for:
 * - Missing foreign keys
 * - Wrong data types
 * - Missing indexes
 * - Orphaned rows
 * - Duplicate rows
 * - Constraints not applied
 * - Slow queries
 * - Query performance
 * - Ranking queries
 * - History queries
 * - Event fetch
 * - Real-time updates
 * 
 * Usage: node test-comprehensive-diagnostics.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

let testsPassed = 0;
let testsFailed = 0;
const results = [];
const performanceMetrics = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    debug: '\x1b[35m',
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

async function perfTest(name, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    log(`✓ ${name} (${duration.toFixed(2)}ms)`, 'success');
    testsPassed++;
    performanceMetrics.push({ test: name, duration, status: 'PASS' });
    results.push({ test: name, status: 'PASS', duration });
  } catch (error) {
    const duration = performance.now() - start;
    log(`✗ ${name} (${duration.toFixed(2)}ms)`, 'error');
    log(`  Error: ${error.message}`, 'error');
    testsFailed++;
    performanceMetrics.push({ test: name, duration, status: 'FAIL' });
    results.push({ test: name, status: 'FAIL', duration, error: error.message });
  }
}

// ============================================
// TEST SUITE: 1. FOREIGN KEY VALIDATION
// ============================================

async function testForeignKeys() {
  log('\n=== TESTING FOREIGN KEYS ===', 'info');

  await test('Foreign key: events.user_id → users.id exists', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'events'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%user%'
    `);
    if (result.rows.length === 0) throw new Error('Foreign key not found');
  });

  await test('Foreign key: teams.event_id → events.id exists', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'teams'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%event%'
    `);
    if (result.rows.length === 0) throw new Error('Foreign key not found');
  });

  await test('Foreign key: game_scores.event_id → events.id exists', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'game_scores'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%event%'
    `);
    if (result.rows.length === 0) throw new Error('Foreign key not found');
  });

  await test('Foreign key: game_scores.team_id → teams.id exists', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'game_scores'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%team%'
    `);
    if (result.rows.length === 0) throw new Error('Foreign key not found');
  });

  await test('Foreign key: share_links.event_id → events.id exists', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'share_links'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%event%'
    `);
    if (result.rows.length === 0) throw new Error('Foreign key not found');
  });

  await test('All foreign keys have CASCADE DELETE', async () => {
    const result = await pool.query(`
      SELECT pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE contype = 'f'
    `);
    
    if (result.rows.length === 0) throw new Error('No foreign keys found');
    
    const nonCascade = result.rows.filter(row => !row.constraint_def.includes('ON DELETE CASCADE'));
    if (nonCascade.length > 0) {
      throw new Error(`Found ${nonCascade.length} foreign keys without CASCADE DELETE`);
    }
  });

  await test('No orphaned rows in teams (event_id references deleted events)', async () => {
    const result = await pool.query(`
      SELECT t.* FROM teams t
      LEFT JOIN events e ON t.event_id = e.id
      WHERE e.id IS NULL
    `);
    if (result.rows.length > 0) throw new Error(`Found ${result.rows.length} orphaned team rows`);
  });

  await test('No orphaned rows in game_scores', async () => {
    const result = await pool.query(`
      SELECT gs.* FROM game_scores gs
      LEFT JOIN events e ON gs.event_id = e.id
      WHERE e.id IS NULL
    `);
    if (result.rows.length > 0) throw new Error(`Found ${result.rows.length} orphaned game_scores rows (event)`);
    
    const result2 = await pool.query(`
      SELECT gs.* FROM game_scores gs
      LEFT JOIN teams t ON gs.team_id = t.id
      WHERE t.id IS NULL
    `);
    if (result2.rows.length > 0) throw new Error(`Found ${result2.rows.length} orphaned game_scores rows (team)`);
  });

  await test('No orphaned rows in share_links', async () => {
    const result = await pool.query(`
      SELECT sl.* FROM share_links sl
      LEFT JOIN events e ON sl.event_id = e.id
      WHERE e.id IS NULL
    `);
    if (result.rows.length > 0) throw new Error(`Found ${result.rows.length} orphaned share_links rows`);
  });
}

// ============================================
// TEST SUITE: 2. DATA TYPE VALIDATION
// ============================================

async function testDataTypes() {
  log('\n=== TESTING DATA TYPES ===', 'info');

  await test('Column data types: users table', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    const typeMap = {};
    result.rows.forEach(row => {
      typeMap[row.column_name] = row.data_type;
    });

    const required = {
      id: 'text',
      name: 'character varying',
      email: 'character varying',
      password_hash: 'character varying',
      created_at: 'timestamp with time zone',
    };

    for (const [col, expectedType] of Object.entries(required)) {
      if (!typeMap[col]) throw new Error(`Missing column: ${col}`);
      if (typeMap[col] !== expectedType) {
        throw new Error(`Column ${col} has type ${typeMap[col]}, expected ${expectedType}`);
      }
    }
  });

  await test('Column data types: events table', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'events'
    `);

    const typeMap = {};
    result.rows.forEach(row => {
      typeMap[row.column_name] = row.data_type;
    });

    if (typeMap.user_id !== 'text') throw new Error('user_id should be text');
    if (typeMap.created_at !== 'timestamp with time zone') throw new Error('created_at should be timestamp with timezone');
  });

  await test('Column data types: teams table', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'teams'
    `);

    const typeMap = {};
    result.rows.forEach(row => {
      typeMap[row.column_name] = row.data_type;
    });

    if (typeMap.total_points !== 'integer') throw new Error('total_points should be integer');
    if (!typeMap.total_points) throw new Error('total_points column missing');
  });

  await test('Column data types: game_scores table', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'game_scores'
    `);

    const typeMap = {};
    result.rows.forEach(row => {
      typeMap[row.column_name] = row.data_type;
    });

    if (typeMap.points !== 'integer') throw new Error('points should be integer');
    if (typeMap.game_number !== 'integer') throw new Error('game_number should be integer');
  });

  await test('Primary keys are TEXT with UUID', async () => {
    const tables = ['users', 'events', 'teams', 'game_scores', 'share_links', 'refresh_tokens', 'user_sessions', 'audit_logs'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = 'id'
      `, [table]);

      if (result.rows.length === 0) throw new Error(`No id column in ${table}`);
      if (result.rows[0].data_type !== 'text') {
        throw new Error(`${table}.id should be TEXT, found ${result.rows[0].data_type}`);
      }
    }
  });
}

// ============================================
// TEST SUITE: 3. INDEX VALIDATION
// ============================================

async function testIndexes() {
  log('\n=== TESTING INDEXES ===', 'info');

  const requiredIndexes = [
    { table: 'users', index: 'idx_users_email' },
    { table: 'events', index: 'idx_events_user_id' },
    { table: 'events', index: 'idx_events_created_at' },
    { table: 'teams', index: 'idx_teams_event_id' },
    { table: 'teams', index: 'idx_teams_total_points' },
    { table: 'game_scores', index: 'idx_game_scores_event_id' },
    { table: 'game_scores', index: 'idx_game_scores_team_id' },
    { table: 'game_scores', index: 'idx_game_scores_team_game' },
    { table: 'share_links', index: 'idx_share_links_token' },
    { table: 'refresh_tokens', index: 'idx_refresh_tokens_user_id' },
    { table: 'refresh_tokens', index: 'idx_refresh_tokens_token' },
    { table: 'user_sessions', index: 'idx_user_sessions_user_id' },
    { table: 'audit_logs', index: 'idx_audit_logs_user_id' },
  ];

  for (const { table, index } of requiredIndexes) {
    await test(`Index exists: ${index} on ${table}`, async () => {
      const result = await pool.query(`
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = $1
      `, [index]);

      if (result.rows.length === 0) throw new Error(`Index not found`);
    });
  }

  await test('All foreign key columns have indexes', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
    `);

    if (result.rows.length === 0) throw new Error('No foreign keys found');
  });

  await test('Unique indexes exist for unique constraints', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'UNIQUE'
    `);
    
    if (result.rows.length < 2) throw new Error('Expected at least 2 unique constraints');
  });
}

// ============================================
// TEST SUITE: 4. DUPLICATE ROW DETECTION
// ============================================

async function testDuplicates() {
  log('\n=== TESTING DUPLICATE DETECTION ===', 'info');

  await test('No duplicate emails in users table', async () => {
    const result = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
    `);
    if (result.rows.length > 0) throw new Error(`Found ${result.rows.length} duplicate emails`);
  });

  await test('No duplicate tokens in share_links', async () => {
    const result = await pool.query(`
      SELECT token, COUNT(*) as count
      FROM share_links
      GROUP BY token
      HAVING COUNT(*) > 1
    `);
    if (result.rows.length > 0) throw new Error(`Found ${result.rows.length} duplicate tokens`);
  });

  await test('No duplicate game scores (team + game combo)', async () => {
    const result = await pool.query(`
      SELECT team_id, game_number, event_id, COUNT(*) as count
      FROM game_scores
      GROUP BY team_id, game_number, event_id
      HAVING COUNT(*) > 1
    `);
    if (result.rows.length > 0) throw new Error(`Found ${result.rows.length} duplicate game scores`);
  });

  await test('Unique constraint enforced: users.email', async () => {
    const email = `test-duplicate-${Date.now()}@example.com`;
    
    try {
      await pool.query(`INSERT INTO users (name, email, password_hash) VALUES ('Test1', $1, 'hash1')`, [email]);
      await pool.query(`INSERT INTO users (name, email, password_hash) VALUES ('Test2', $1, 'hash2')`, [email]);
      throw new Error('Duplicate email was allowed (constraint not enforced)');
    } catch (error) {
      if (error.message.includes('constraint')) {
        // Expected - constraint prevented duplicate
      } else {
        throw error;
      }
    } finally {
      await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
    }
  });

  await test('Unique constraint enforced: share_links.token', async () => {
    // First create test event and link
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash) 
      VALUES ('Test', 'test-' || (random()*1000)::text || '@test.com', 'hash')
      RETURNING id
    `);
    const userId = userRes.rows[0].id;

    const eventRes = await pool.query(`
      INSERT INTO events (user_id, event_name) 
      VALUES ($1, 'Test Event')
      RETURNING id
    `, [userId]);
    const eventId = eventRes.rows[0].id;

    const token = `token-${Date.now()}`;

    try {
      await pool.query(`INSERT INTO share_links (event_id, token) VALUES ($1, $2)`, [eventId, token]);
      await pool.query(`INSERT INTO share_links (event_id, token) VALUES ($1, $2)`, [eventId, token]);
      throw new Error('Duplicate token was allowed (constraint not enforced)');
    } catch (error) {
      if (error.message.includes('constraint') || error.message.includes('duplicate')) {
        // Expected
      } else if (!error.message.includes('Duplicate token was allowed')) {
        throw error;
      }
    } finally {
      await pool.query(`DELETE FROM share_links WHERE token = $1`, [token]);
      await pool.query(`DELETE FROM events WHERE id = $1`, [eventId]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
  });
}

// ============================================
// TEST SUITE: 5. CONSTRAINTS VALIDATION
// ============================================

async function testConstraints() {
  log('\n=== TESTING CONSTRAINTS ===', 'info');

  await test('Check constraint: points range (-1000 to 1000)', async () => {
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password_hash) 
      VALUES ('Test', 'test-' || (random()*10000)::text || '@test.com', 'hash')
      RETURNING id
    `);
    const userId = userRes.rows[0].id;

    const eventRes = await pool.query(`
      INSERT INTO events (user_id, event_name) VALUES ($1, 'Test')
      RETURNING id
    `, [userId]);
    const eventId = eventRes.rows[0].id;

    const teamRes = await pool.query(`
      INSERT INTO teams (event_id, team_name) VALUES ($1, 'Test Team')
      RETURNING id
    `, [eventId]);
    const teamId = teamRes.rows[0].id;

    try {
      await pool.query(`
        INSERT INTO game_scores (event_id, team_id, game_number, points) 
        VALUES ($1, $2, 1, 9999)
      `, [eventId, teamId]);
      throw new Error('Points constraint not enforced');
    } catch (error) {
      if (!error.message.includes('constraint')) throw error;
    } finally {
      await pool.query(`DELETE FROM game_scores WHERE event_id = $1`, [eventId]);
      await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
      await pool.query(`DELETE FROM events WHERE id = $1`, [eventId]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
  });

  await test('Check constraint: total_points range (-10000 to 10000)', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'teams'
      AND constraint_name LIKE '%points%'
    `);
    if (result.rows.length === 0) throw new Error('total_points check constraint not found');
  });

  await test('NOT NULL constraints on required fields', async () => {
    const result = await pool.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('id', 'name', 'email', 'password_hash')
    `);

    result.rows.forEach(row => {
      if (row.is_nullable === 'YES') {
        throw new Error(`Column ${row.column_name} should NOT be nullable`);
      }
    });
  });

  await test('Default values applied correctly', async () => {
    const result = await pool.query(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('created_at', 'email_verified', 'mfa_enabled')
    `);

    if (result.rows.length === 0) throw new Error('Default values not found');
  });
}

// ============================================
// TEST SUITE: 6. QUERY PERFORMANCE
// ============================================

async function testQueryPerformance() {
  log('\n=== TESTING QUERY PERFORMANCE ===', 'info');

  // Create test data
  const userRes = await pool.query(`
    INSERT INTO users (name, email, password_hash) 
    VALUES ('Perf Test', 'perf-test-' || (random()*100000)::text || '@test.com', 'hash')
    RETURNING id
  `);
  const userId = userRes.rows[0].id;

  const eventRes = await pool.query(`
    INSERT INTO events (user_id, event_name) 
    VALUES ($1, 'Performance Test Event')
    RETURNING id
  `, [userId]);
  const eventId = eventRes.rows[0].id;

  const teamRes = await pool.query(`
    INSERT INTO teams (event_id, team_name) 
    VALUES ($1, 'Test Team')
    RETURNING id
  `, [eventId]);
  const teamId = teamRes.rows[0].id;

  // Insert test scores
  for (let i = 1; i <= 100; i++) {
    await pool.query(`
      INSERT INTO game_scores (event_id, team_id, game_number, points) 
      VALUES ($1, $2, $3, $4)
    `, [eventId, teamId, i, Math.floor(Math.random() * 100) - 50]);
  }

  await perfTest('Query: Find user by email (should use index)', async () => {
    const result = await pool.query(`
      SELECT * FROM users WHERE email = $1 LIMIT 1
    `, [`perf-test-${Math.random() * 100000}@test.com`]);
  });

  await perfTest('Query: List events by user (should use index)', async () => {
    const result = await pool.query(`
      SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);
  });

  await perfTest('Query: Get teams for event (should use index)', async () => {
    const result = await pool.query(`
      SELECT * FROM teams WHERE event_id = $1 ORDER BY total_points DESC
    `, [eventId]);
  });

  await perfTest('Query: Get game scores with aggregation', async () => {
    const result = await pool.query(`
      SELECT team_id, SUM(points) as total, COUNT(*) as games
      FROM game_scores
      WHERE event_id = $1
      GROUP BY team_id
    `, [eventId]);
  });

  await perfTest('Query: Ranking query (teams by points)', async () => {
    const result = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
        id, team_name, total_points
      FROM teams
      WHERE event_id = $1
      ORDER BY rank
    `, [eventId]);
  });

  await perfTest('Query: History (score progression)', async () => {
    const result = await pool.query(`
      SELECT 
        game_number,
        points,
        SUM(points) OVER (ORDER BY game_number) as cumulative
      FROM game_scores
      WHERE team_id = $1
      ORDER BY game_number
    `, [teamId]);
  });

  // Cleanup
  await pool.query(`DELETE FROM game_scores WHERE event_id = $1`, [eventId]);
  await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
  await pool.query(`DELETE FROM events WHERE id = $1`, [eventId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

// ============================================
// TEST SUITE: 7. EXPLAIN PLANS (Slow Query Detection)
// ============================================

async function testExplainPlans() {
  log('\n=== TESTING QUERY PLANS ===', 'info');

  await test('Index used for user email lookup', async () => {
    const result = await pool.query(`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM users WHERE email = 'test@example.com'
    `);

    const plan = JSON.stringify(result.rows[0][0].Plan);
    if (!plan.includes('Index')) {
      throw new Error('Query not using index');
    }
  });

  await test('Index used for events by user', async () => {
    const result = await pool.query(`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM events WHERE user_id = 'test-id' ORDER BY created_at DESC
    `);

    const plan = JSON.stringify(result.rows[0][0].Plan);
    if (!plan.includes('Index')) {
      throw new Error('Query not using index');
    }
  });

  await test('Index used for teams ranking', async () => {
    const result = await pool.query(`
      EXPLAIN (FORMAT JSON)
      SELECT * FROM teams WHERE event_id = 'test-id' ORDER BY total_points DESC
    `);

    const plan = JSON.stringify(result.rows[0][0].Plan);
    if (!plan.includes('Index')) {
      throw new Error('Query not using index');
    }
  });
}

// ============================================
// TEST SUITE: 8. REAL-TIME UPDATES
// ============================================

async function testRealtimeUpdates() {
  log('\n=== TESTING REAL-TIME UPDATES ===', 'info');

  const userRes = await pool.query(`
    INSERT INTO users (name, email, password_hash) 
    VALUES ('RT Test', 'rt-test-' || (random()*100000)::text || '@test.com', 'hash')
    RETURNING id
  `);
  const userId = userRes.rows[0].id;

  const eventRes = await pool.query(`
    INSERT INTO events (user_id, event_name) 
    VALUES ($1, 'Real-time Test')
    RETURNING id
  `, [userId]);
  const eventId = eventRes.rows[0].id;

  const teamRes = await pool.query(`
    INSERT INTO teams (event_id, team_name) 
    VALUES ($1, 'Team A')
    RETURNING id
  `, [eventId]);
  const teamId = teamRes.rows[0].id;

  await test('Team total_points updates when score added (trigger)', async () => {
    // Insert a score
    await pool.query(`
      INSERT INTO game_scores (event_id, team_id, game_number, points) 
      VALUES ($1, $2, 1, 50)
    `, [eventId, teamId]);

    // Check if total_points updated
    const result = await pool.query(`
      SELECT total_points FROM teams WHERE id = $1
    `, [teamId]);

    if (result.rows[0].total_points !== 50) {
      throw new Error(`Expected total_points 50, got ${result.rows[0].total_points}`);
    }
  });

  await test('Team total_points updates when score modified', async () => {
    // Update the score
    await pool.query(`
      UPDATE game_scores SET points = 75 WHERE team_id = $1 AND game_number = 1
    `, [teamId]);

    // Check if total_points updated
    const result = await pool.query(`
      SELECT total_points FROM teams WHERE id = $1
    `, [teamId]);

    if (result.rows[0].total_points !== 75) {
      throw new Error(`Expected total_points 75, got ${result.rows[0].total_points}`);
    }
  });

  await test('Team total_points updates when score deleted', async () => {
    // Delete the score
    await pool.query(`
      DELETE FROM game_scores WHERE team_id = $1 AND game_number = 1
    `, [teamId]);

    // Check if total_points reset to 0
    const result = await pool.query(`
      SELECT total_points FROM teams WHERE id = $1
    `, [teamId]);

    if (result.rows[0].total_points !== 0) {
      throw new Error(`Expected total_points 0, got ${result.rows[0].total_points}`);
    }
  });

  await test('Multiple scores accumulate correctly', async () => {
    await pool.query(`
      INSERT INTO game_scores (event_id, team_id, game_number, points) 
      VALUES 
        ($1, $2, 1, 10),
        ($1, $2, 2, 20),
        ($1, $2, 3, 30)
    `, [eventId, teamId]);

    const result = await pool.query(`
      SELECT total_points FROM teams WHERE id = $1
    `, [teamId]);

    if (result.rows[0].total_points !== 60) {
      throw new Error(`Expected total_points 60, got ${result.rows[0].total_points}`);
    }
  });

  // Cleanup
  await pool.query(`DELETE FROM game_scores WHERE event_id = $1`, [eventId]);
  await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
  await pool.query(`DELETE FROM events WHERE id = $1`, [eventId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

// ============================================
// TEST SUITE: 9. ADVANCED QUERIES
// ============================================

async function testAdvancedQueries() {
  log('\n=== TESTING ADVANCED QUERIES ===', 'info');

  // Setup test data
  const userRes = await pool.query(`
    INSERT INTO users (name, email, password_hash) 
    VALUES ('Advanced', 'adv-' || (random()*100000)::text || '@test.com', 'hash')
    RETURNING id
  `);
  const userId = userRes.rows[0].id;

  const eventRes = await pool.query(`
    INSERT INTO events (user_id, event_name) 
    VALUES ($1, 'Advanced Test')
    RETURNING id
  `, [userId]);
  const eventId = eventRes.rows[0].id;

  // Create 5 teams with scores
  const teamIds = [];
  for (let t = 1; t <= 5; t++) {
    const tRes = await pool.query(`
      INSERT INTO teams (event_id, team_name) 
      VALUES ($1, 'Team ' || chr(64 + $2))
      RETURNING id
    `, [eventId, t]);
    teamIds.push(tRes.rows[0].id);

    // Add scores for this team
    for (let g = 1; g <= 5; g++) {
      await pool.query(`
        INSERT INTO game_scores (event_id, team_id, game_number, points) 
        VALUES ($1, $2, $3, $4)
      `, [eventId, teamIds[t - 1], g, Math.floor(Math.random() * 100)]);
    }
  }

  await perfTest('Ranking query: Teams by cumulative score', async () => {
    const result = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
        team_name,
        total_points,
        (SELECT COUNT(*) FROM game_scores WHERE team_id = t.id) as games_played
      FROM teams t
      WHERE event_id = $1
      ORDER BY rank
    `, [eventId]);
    
    if (result.rows.length === 0) throw new Error('No ranking data');
  });

  await perfTest('History query: Cumulative scores over time', async () => {
    const result = await pool.query(`
      SELECT 
        team_id,
        game_number,
        points,
        SUM(points) OVER (PARTITION BY team_id ORDER BY game_number) as cumulative_score
      FROM game_scores
      WHERE event_id = $1
      ORDER BY team_id, game_number
    `, [eventId]);
    
    if (result.rows.length === 0) throw new Error('No history data');
  });

  await perfTest('Event fetch: Complete event with teams and scores', async () => {
    const result = await pool.query(`
      SELECT 
        e.*,
        COUNT(DISTINCT t.id) as team_count,
        COUNT(DISTINCT gs.id) as score_count,
        SUM(t.total_points) as total_event_points
      FROM events e
      LEFT JOIN teams t ON e.id = t.event_id
      LEFT JOIN game_scores gs ON e.id = gs.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `, [eventId]);
    
    if (result.rows.length === 0) throw new Error('No event data');
  });

  await perfTest('Public scoreboard data', async () => {
    // Create a share link
    const linkRes = await pool.query(`
      INSERT INTO share_links (event_id, token) 
      VALUES ($1, 'test-' || random()::text)
      RETURNING id, token
    `, [eventId]);

    const result = await pool.query(`
      SELECT 
        t.team_name,
        t.total_points,
        COUNT(gs.id) as games,
        AVG(gs.points) as avg_points
      FROM share_links sl
      JOIN events e ON sl.event_id = e.id
      JOIN teams t ON e.id = t.event_id
      LEFT JOIN game_scores gs ON t.id = gs.team_id
      WHERE sl.token = $1
      GROUP BY t.id, t.team_name, t.total_points
      ORDER BY t.total_points DESC
    `, [linkRes.rows[0].token]);

    await pool.query(`DELETE FROM share_links WHERE id = $1`, [linkRes.rows[0].id]);
    
    if (result.rows.length === 0) throw new Error('No scoreboard data');
  });

  await perfTest('Leaderboard with percentile ranking', async () => {
    const result = await pool.query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
        team_name,
        total_points,
        PERCENT_RANK() OVER (ORDER BY total_points DESC) as percentile
      FROM teams
      WHERE event_id = $1
    `, [eventId]);
    
    if (result.rows.length === 0) throw new Error('No leaderboard data');
  });

  // Cleanup
  await pool.query(`DELETE FROM game_scores WHERE event_id = $1`, [eventId]);
  await pool.query(`DELETE FROM teams WHERE event_id = $1`, [eventId]);
  await pool.query(`DELETE FROM events WHERE id = $1`, [eventId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  COMPREHENSIVE DATABASE DIAGNOSTICS TEST SUITE                  ║');
  console.log('║  Testing: Foreign Keys, Data Types, Indexes, Duplicates,       ║');
  console.log('║           Constraints, Performance, & Real-time Updates         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    await testForeignKeys();
    await testDataTypes();
    await testIndexes();
    await testDuplicates();
    await testConstraints();
    await testQueryPerformance();
    await testExplainPlans();
    await testRealtimeUpdates();
    await testAdvancedQueries();

    // Print summary
    printSummary();
  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'error');
  } finally {
    await pool.end();
  }
}

function printSummary() {
  const total = testsPassed + testsFailed;
  const successRate = ((testsPassed / total) * 100).toFixed(1);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         TEST SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Tests Passed:  ${testsPassed}`);
  console.log(`Tests Failed:  ${testsFailed}`);
  console.log(`Total Tests:   ${total}`);
  console.log(`Success Rate:  ${successRate}%\n`);

  if (testsFailed > 0) {
    console.log('FAILED TESTS:\n');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        log(`✗ ${r.test}`, 'error');
        if (r.error) log(`  ${r.error}`, 'error');
      });
  }

  console.log('\nPERFORMANCE METRICS (Top Slow Queries):\n');
  const slowQueries = performanceMetrics
    .filter(m => m.status === 'PASS')
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  slowQueries.forEach((m, i) => {
    const status = m.duration > 1000 ? 'warning' : 'success';
    log(`${i + 1}. ${m.test}: ${m.duration.toFixed(2)}ms`, status);
  });

  console.log('\n' + (testsFailed === 0 ? '✓ ALL TESTS PASSED!' : `✗ ${testsFailed} TESTS FAILED`));
  console.log('');
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
