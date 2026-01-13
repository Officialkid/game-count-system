const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const fileArg = process.argv[2];

if (!connectionString) {
  console.error('Please set DATABASE_URL environment variable.');
  process.exit(1);
}

if (!fileArg) {
  console.error('Usage: node run-sql-file.js <migrations/your-file.sql>');
  process.exit(1);
}

const filePath = path.join(__dirname, fileArg);
if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`🚀 Executing ${fileArg}...`);
    await client.query(sql);
    console.log('✅ SQL execution completed');
  } catch (err) {
    console.error('\n❌ SQL execution failed:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

run();
