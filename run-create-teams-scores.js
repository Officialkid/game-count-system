const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Please set DATABASE_URL environment variable.');
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    const sql = `
      CREATE TABLE IF NOT EXISTS public.teams (
        id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
        event_id UUID NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.scores (
        id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
        event_id UUID NOT NULL,
        day_id UUID,
        team_id UUID,
        category TEXT,
        points INTEGER,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;

    console.log('🚀 Creating `teams` and `scores` tables (if missing)');
    await client.query(sql);
    console.log('✅ teams and scores tables ensured');

  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

run();
