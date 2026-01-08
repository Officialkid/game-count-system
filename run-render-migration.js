/**
 * Database Migration: Add finalized columns to events table
 * Using Render PostgreSQL credentials
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db';

async function runMigration() {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Starting migration...');
    console.log('📡 Connecting to Render PostgreSQL...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully!\n');
    
    console.log('📂 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'add-finalized-column.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Executing SQL commands...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  • is_finalized (BOOLEAN, DEFAULT FALSE)');
    console.log('  • finalized_at (TIMESTAMP)');
    console.log('  • Index: idx_events_is_finalized\n');
    
    // Verify the columns were added
    console.log('🔍 Verifying migration...');
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND column_name IN ('is_finalized', 'finalized_at')
      ORDER BY column_name;
    `);
    
    if (result.rows.length === 2) {
      console.log('✅ Verification successful!\n');
      console.log('Columns found:');
      result.rows.forEach(row => {
        console.log(`  • ${row.column_name}: ${row.data_type}${row.column_default ? ' (default: ' + row.column_default + ')' : ''}`);
      });
    } else {
      console.log('⚠️  Found', result.rows.length, 'columns (expected 2)');
      if (result.rows.length > 0) {
        result.rows.forEach(row => {
          console.log(`  • ${row.column_name}: ${row.data_type}`);
        });
      }
    }
    
    console.log('\n🎉 Migration complete! The finalization feature is now ready to use.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Columns may already exist. Checking...');
      try {
        const check = await pool.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'events'
          AND column_name IN ('is_finalized', 'finalized_at');
        `);
        if (check.rows.length === 2) {
          console.log('✅ Migration already applied! Both columns exist.');
          console.log('   The finalization feature is ready to use.');
        }
      } catch (e) {
        console.error('Could not verify:', e.message);
      }
    } else {
      console.error('\nError details:', error);
      process.exit(1);
    }
  } finally {
    await pool.end();
    console.log('\n✨ Database connection closed');
  }
}

// Run migration
runMigration();
