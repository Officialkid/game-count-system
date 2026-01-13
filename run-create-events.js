const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Please set DATABASE_URL environment variable.');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    // Ensure pgcrypto for gen_random_uuid
    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

    const sql = `
      CREATE TABLE IF NOT EXISTS public.events (
        id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
        name TEXT,
        mode TEXT DEFAULT 'quick',
        start_at TIMESTAMP,
        end_at TIMESTAMP,
        retention_policy TEXT,
        expires_at TIMESTAMPTZ,
        admin_token TEXT,
        scorer_token TEXT,
        public_token TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    console.log('🚀 Creating `events` table if missing...');
    await client.query(sql);
    console.log('✅ events table ensured (if it did not exist, it was created)');

  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

run();
