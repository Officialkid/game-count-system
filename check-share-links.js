// check-share-links.js
require('dotenv').config();
const { Client } = require('pg');

async function checkShareLinks() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log('🔍 Checking share_links table...\n');
    
    const links = await client.query('SELECT * FROM share_links');
    console.log(`Found ${links.rows.length} share links:\n`);
    console.log(JSON.stringify(links.rows, null, 2));
    
    console.log('\n🔍 Checking events table...\n');
    const events = await client.query('SELECT id, event_name, created_at FROM events');
    console.log(`Found ${events.rows.length} events:\n`);
    console.log(JSON.stringify(events.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    process.exit();
  }
}

checkShareLinks();
