// check-tables.js - Check what tables exist
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://game_count_system_user:Vvqipqx7KI0IOSVEy8hddMKoEQEod1jr@dpg-d4o1jli4d50c73a62no0-a.oregon-postgres.render.com:5432/game_count_system',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Existing tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    const tableNames = result.rows.map(r => r.table_name);
    
    console.log('\n❓ Missing tables:');
    const requiredTables = ['users', 'events', 'teams', 'game_scores', 'share_links', 'refresh_tokens', 'user_sessions', 'audit_logs'];
    requiredTables.forEach(table => {
      if (!tableNames.includes(table)) {
        console.log(`  ❌ ${table}`);
      } else {
        console.log(`  ✅ ${table}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
