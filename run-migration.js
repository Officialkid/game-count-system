// run-migration.js - Run database migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://game_count_system_user:Vvqipqx7KI0IOSVEy8hddMKoEQEod1jr@dpg-d4o1jli4d50c73a62no0-a.oregon-postgres.render.com:5432/game_count_system',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '00-complete-init.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running 00-complete-init.sql...');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Verifying tables...');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\nCreated tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    console.log('\n🎉 Database is ready! You can now register and login.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
