require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const result = await pool.query(`
      SELECT id, team_name, event_id, total_points 
      FROM teams 
      WHERE event_id = 'f9ce5d4f-89bc-41d9-b491-9dd2f1d1a8c4'
      ORDER BY team_name
    `);
    
    console.log('Teams for Vault gamers event:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
})();
