/**
 * Database Migration: Add finalized columns to events table
 * Run: node run-finalize-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting migration...');
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
      console.log('⚠️  Warning: Expected 2 columns but found', result.rows.length);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✨ Database connection closed');
  }
}

// Run migration
runMigration();
