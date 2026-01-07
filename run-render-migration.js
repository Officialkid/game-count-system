#!/usr/bin/env node
/**
 * Run PostgreSQL schema migration on Render database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Render PostgreSQL database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!\n');

    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    console.log(`📖 Reading migration file: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration...\n');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n✨ Database is ready for use!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
