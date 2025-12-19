require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? '✓ Found' : '✗ Missing');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    console.log('\n🔌 Attempting to connect to database...');
    
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    
    console.log('\n✅ DATABASE CONNECTION SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Current time from DB:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    // Test basic query on teams table
    console.log('\n🏆 Testing teams table...');
    const teamsResult = await pool.query('SELECT COUNT(*) as team_count FROM teams');
    console.log('Number of teams:', teamsResult.rows[0].team_count);
    
    await pool.end();
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION FAILED!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    await pool.end();
    process.exit(1);
  }
}

testConnection();
