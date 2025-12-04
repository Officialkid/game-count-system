// run-migration.js - Run database migration for event dates
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 Running migration: 001_add_event_dates.sql\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_add_event_dates.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Adding start_date and end_date columns to events table...');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Added: start_date (DATE, nullable)');
    console.log('✅ Added: end_date (DATE, nullable)');
    console.log('✅ Added: check_event_dates constraint');
    console.log('✅ Added: idx_events_end_date index');
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('start_date', 'end_date')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Verified columns:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🎉 Event dates feature is now ready!');
    
  } catch (error) {
    if (error.code === '42701') {
      console.log('ℹ️  Columns already exist - migration was already applied');
    } else {
      console.error('\n❌ Migration failed:', error.message);
      console.error('Error code:', error.code);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
