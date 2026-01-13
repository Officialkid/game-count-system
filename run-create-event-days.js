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

    await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

    const sql = `
      CREATE TABLE IF NOT EXISTS public.event_days (
        id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
        event_id UUID NOT NULL,
        day_number INTEGER NOT NULL,
        label TEXT,
        is_locked BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- Trigger function to set label
      CREATE OR REPLACE FUNCTION public.event_days_set_label()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.label IS NULL OR trim(NEW.label) = '' THEN
          NEW.label := 'Day ' || NEW.day_number::TEXT;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Attach trigger if not exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
          WHERE c.relname = 'event_days' AND t.tgname = 'trg_event_days_set_label'
        ) THEN
          CREATE TRIGGER trg_event_days_set_label
            BEFORE INSERT OR UPDATE ON public.event_days
            FOR EACH ROW EXECUTE FUNCTION public.event_days_set_label();
        END IF;
      END $$;
    `;

    console.log('🚀 Creating `event_days` table and trigger (if missing)');
    await client.query(sql);
    console.log('✅ event_days table ensured');

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
