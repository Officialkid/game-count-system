-- migrations/schema-align-events-and-days.sql
-- Safe, idempotent migration to align DB with GameScore app
-- Rules followed: IF NOT EXISTS, no DROP TABLE, idempotent, non-destructive

-- NOTES:
-- - Adds missing columns to `events` with safe DEFAULTs where appropriate
-- - Adds CHECK constraints only when the related columns exist
-- - Creates `event_days` table if missing and ensures `label` is NOT NULL via a trigger/backfill
-- - Adds requested indexes if the target tables/columns exist
-- - Uses RAISE NOTICE for idempotent logging

DO $$
BEGIN
  -- 1) Add columns to events table if missing
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN

    -- mode TEXT DEFAULT 'quick'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'mode'
    ) THEN
      ALTER TABLE public.events
        ADD COLUMN mode TEXT DEFAULT 'quick';
      RAISE NOTICE 'Added column events.mode with default ''quick''';
    ELSE
      RAISE NOTICE 'Column events.mode already exists';
    END IF;

    -- retention_policy TEXT DEFAULT 'manual'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'retention_policy'
    ) THEN
      ALTER TABLE public.events
        ADD COLUMN retention_policy TEXT DEFAULT 'manual';
      RAISE NOTICE 'Added column events.retention_policy with default ''manual''';
    ELSE
      RAISE NOTICE 'Column events.retention_policy already exists';
    END IF;

    -- admin_token, scorer_token, public_token (nullable text)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'admin_token'
    ) THEN
      ALTER TABLE public.events ADD COLUMN admin_token TEXT;
      RAISE NOTICE 'Added column events.admin_token';
    ELSE
      RAISE NOTICE 'Column events.admin_token already exists';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'scorer_token'
    ) THEN
      ALTER TABLE public.events ADD COLUMN scorer_token TEXT;
      RAISE NOTICE 'Added column events.scorer_token';
    ELSE
      RAISE NOTICE 'Column events.scorer_token already exists';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'public_token'
    ) THEN
      ALTER TABLE public.events ADD COLUMN public_token TEXT;
      RAISE NOTICE 'Added column events.public_token';
    ELSE
      RAISE NOTICE 'Column events.public_token already exists';
    END IF;

    -- status TEXT DEFAULT 'active'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'status'
    ) THEN
      ALTER TABLE public.events ADD COLUMN status TEXT DEFAULT 'active';
      RAISE NOTICE 'Added column events.status with default ''active''';
    ELSE
      RAISE NOTICE 'Column events.status already exists';
    END IF;

    -- expires_at TIMESTAMPTZ
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'expires_at'
    ) THEN
      ALTER TABLE public.events ADD COLUMN expires_at TIMESTAMPTZ;
      RAISE NOTICE 'Added column events.expires_at';
    ELSE
      RAISE NOTICE 'Column events.expires_at already exists';
    END IF;

  ELSE
    RAISE NOTICE 'Table public.events does not exist; skipping events column additions';
  END IF;
END $$;

-- 2) Add CHECK constraints only if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'mode') THEN
    BEGIN
      ALTER TABLE public.events
        ADD CONSTRAINT IF NOT EXISTS events_mode_check
        CHECK (mode IN ('quick', 'camp', 'advanced'));
      RAISE NOTICE 'Ensured events_mode_check';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_mode_check already exists';
    END;
  ELSE
    RAISE NOTICE 'Skipping events_mode_check: events.mode not present';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'retention_policy') THEN
    BEGIN
      ALTER TABLE public.events
        ADD CONSTRAINT IF NOT EXISTS events_retention_policy_check
        CHECK (retention_policy IS NULL OR retention_policy IN ('auto_expire','manual','archive','permanent'));
      RAISE NOTICE 'Ensured events_retention_policy_check';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_retention_policy_check already exists';
    END;
  ELSE
    RAISE NOTICE 'Skipping events_retention_policy_check: events.retention_policy not present';
  END IF;

  -- expires_at > start_date (or start_at) if both columns exist
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('expires_at','start_date')) = 2 THEN
    BEGIN
      ALTER TABLE public.events
        ADD CONSTRAINT IF NOT EXISTS events_expires_after_start_date_check
        CHECK (expires_at IS NULL OR start_date IS NULL OR expires_at > start_date);
      RAISE NOTICE 'Ensured events_expires_after_start_date_check (start_date/end_date variant)';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_expires_after_start_date_check already exists';
    END;
  ELSIF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('expires_at','start_at')) = 2 THEN
    BEGIN
      ALTER TABLE public.events
        ADD CONSTRAINT IF NOT EXISTS events_expires_after_start_check
        CHECK (expires_at IS NULL OR start_at IS NULL OR expires_at > start_at);
      RAISE NOTICE 'Ensured events_expires_after_start_check (start_at/end_at variant)';
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_expires_after_start_check already exists';
    END;
  ELSE
    RAISE NOTICE 'Skipping expires vs start check: required columns not present';
  END IF;
END $$;

-- 3) Create event_days table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_days') THEN
    -- Ensure pgcrypto extension for gen_random_uuid (non-destructive)
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create extension pgcrypto (may require superuser); proceeding without default uuid generator';
    END;

    CREATE TABLE public.event_days (
      id UUID PRIMARY KEY DEFAULT (gen_random_uuid()),
      event_id TEXT NOT NULL,
      day_number INT NOT NULL,
      label TEXT,
      is_locked BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    RAISE NOTICE 'Created table public.event_days';

    -- Add FK to events.event_id if events table exists and id type matches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events') THEN
      BEGIN
        -- Only add FK if not exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'event_days' AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN
          ALTER TABLE public.event_days
            ADD CONSTRAINT event_days_event_id_fkey FOREIGN KEY (event_id)
            REFERENCES public.events (id) ON DELETE CASCADE;
          RAISE NOTICE 'Added FK public.event_days.event_id -> public.events.id';
        ELSE
          RAISE NOTICE 'Foreign key for event_days.event_id already exists';
        END IF;
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not add FK for event_days.event_id (skipping)';
      END;
    END IF;

  ELSE
    RAISE NOTICE 'Table public.event_days already exists';
  END IF;
END $$;

-- 4) Create trigger function to fill label when NULL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'event_days_set_label') THEN
    CREATE OR REPLACE FUNCTION public.event_days_set_label()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.label IS NULL OR trim(NEW.label) = '' THEN
        NEW.label := 'Day ' || NEW.day_number::TEXT;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    RAISE NOTICE 'Created function event_days_set_label';
  ELSE
    RAISE NOTICE 'Function event_days_set_label already exists';
  END IF;
END $$;

-- Attach trigger to event_days if not present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_days') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'event_days' AND t.tgname = 'trg_event_days_set_label'
    ) THEN
      CREATE TRIGGER trg_event_days_set_label
        BEFORE INSERT OR UPDATE ON public.event_days
        FOR EACH ROW EXECUTE FUNCTION public.event_days_set_label();
      RAISE NOTICE 'Attached trigger trg_event_days_set_label to public.event_days';
    ELSE
      RAISE NOTICE 'Trigger trg_event_days_set_label already exists on public.event_days';
    END IF;
  ELSE
    RAISE NOTICE 'Table public.event_days missing; skipping trigger attach';
  END IF;
END $$;

-- 5) Backfill existing event_days.label values and set NOT NULL if safe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_days') THEN
    -- Backfill NULL labels
    UPDATE public.event_days SET label = 'Day ' || day_number::TEXT WHERE label IS NULL OR trim(label) = '';
    RAISE NOTICE 'Backfilled event_days.label for NULLs';

    -- Ensure no NULLs remain, then set NOT NULL constraint
    PERFORM 1 FROM public.event_days WHERE label IS NULL LIMIT 1;
    IF NOT FOUND THEN
      -- Only set NOT NULL if no nulls
      BEGIN
        ALTER TABLE public.event_days ALTER COLUMN label SET NOT NULL;
        RAISE NOTICE 'Set event_days.label NOT NULL';
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not set event_days.label NOT NULL (will remain nullable)';
      END;
    ELSE
      RAISE NOTICE 'event_days.label still contains NULLs; skipping NOT NULL alter';
    END IF;
  ELSE
    RAISE NOTICE 'Table public.event_days missing; skipping backfill/NOT NULL';
  END IF;
END $$;

-- 6) Create indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_days') THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_event_days_event_id_day_number ON public.event_days (event_id, day_number);
      RAISE NOTICE 'Ensured index idx_event_days_event_id_day_number';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create index idx_event_days_event_id_day_number';
    END;
  ELSE
    RAISE NOTICE 'Skipping index creation for event_days: table missing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='teams') THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams (event_id);
      RAISE NOTICE 'Ensured index idx_teams_event_id';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create index idx_teams_event_id';
    END;
  ELSE
    RAISE NOTICE 'Skipping idx_teams_event_id: teams table missing';
  END IF;
END $$;

-- 7) Final verification: list created/ensured columns, constraints, indexes
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== events columns ===';
  FOR rec IN SELECT column_name FROM information_schema.columns WHERE table_name = 'events' ORDER BY ordinal_position LOOP
    RAISE NOTICE '%', rec.column_name;
  END LOOP;

  RAISE NOTICE '=== events CHECK constraints ===';
  FOR rec IN SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name IN (
    SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'events' AND constraint_type = 'CHECK'
  ) LOOP
    RAISE NOTICE '% | %', rec.constraint_name, rec.check_clause;
  END LOOP;

  RAISE NOTICE '=== event_days columns ===';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_days') THEN
    FOR rec IN SELECT column_name FROM information_schema.columns WHERE table_name = 'event_days' ORDER BY ordinal_position LOOP
      RAISE NOTICE '%', rec.column_name;
    END LOOP;
  ELSE
    RAISE NOTICE 'event_days not present';
  END IF;

  RAISE NOTICE '=== indexes on event_days and teams ===';
  FOR rec IN SELECT indexname FROM pg_indexes WHERE tablename IN ('event_days','teams') LOOP
    RAISE NOTICE '%', rec.indexname;
  END LOOP;
END $$;
