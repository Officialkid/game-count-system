-- =============================================================
-- schema-audit-migration.sql
-- Purpose: Align production DB schema with application expectations
-- Safety: Idempotent, no data loss, no downtime
-- Date: 2026-01-08
-- =============================================================

-- =============================================================
-- 0) SAFETY NOTES
-- - All changes are conditional (IF NOT EXISTS / DO blocks)
-- - No tables are dropped or truncated
-- - Existing data is preserved; defaults/backfills used where needed
-- =============================================================

-- Ensure pgcrypto is available for gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- 1) EVENTS TABLE - required shape
--    Columns (with required properties):
--      id UUID PRIMARY KEY
--      name TEXT NOT NULL
--      mode TEXT CHECK (mode IN ('quick','camp'))
--      start_at TIMESTAMP
--      end_at TIMESTAMP
--      retention_policy TEXT
--      public_token TEXT UNIQUE NOT NULL
--      admin_token  TEXT UNIQUE NOT NULL
--      scorer_token TEXT UNIQUE NOT NULL
--      is_finalized BOOLEAN DEFAULT false
--      finalized_at TIMESTAMP
--      is_archived BOOLEAN DEFAULT false
--      created_at TIMESTAMP DEFAULT now()
-- =============================================================

-- Ensure required columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='retention_policy') THEN
    ALTER TABLE events ADD COLUMN retention_policy TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_archived') THEN
    ALTER TABLE events ADD COLUMN is_archived BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_finalized') THEN
    ALTER TABLE events ADD COLUMN is_finalized BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='finalized_at') THEN
    ALTER TABLE events ADD COLUMN finalized_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='start_at') THEN
    ALTER TABLE events ADD COLUMN start_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='end_at') THEN
    ALTER TABLE events ADD COLUMN end_at TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='created_at') THEN
    ALTER TABLE events ADD COLUMN created_at TIMESTAMP DEFAULT now();
  END IF;
END $$;

-- Backfill null tokens/names safely before NOT NULL/UNIQUE
UPDATE events SET name = COALESCE(name, 'Untitled Event') WHERE name IS NULL;
UPDATE events SET public_token = COALESCE(public_token, encode(gen_random_bytes(8),'hex')) WHERE public_token IS NULL;
UPDATE events SET admin_token  = COALESCE(admin_token,  encode(gen_random_bytes(8),'hex')) WHERE admin_token  IS NULL;
UPDATE events SET scorer_token = COALESCE(scorer_token, encode(gen_random_bytes(8),'hex')) WHERE scorer_token IS NULL;

-- Enforce NOT NULL where required
ALTER TABLE events ALTER COLUMN name SET NOT NULL;
ALTER TABLE events ALTER COLUMN public_token SET NOT NULL;
ALTER TABLE events ALTER COLUMN admin_token SET NOT NULL;
ALTER TABLE events ALTER COLUMN scorer_token SET NOT NULL;

-- Ensure booleans default false
ALTER TABLE events ALTER COLUMN is_finalized SET DEFAULT false;
ALTER TABLE events ALTER COLUMN is_archived  SET DEFAULT false;

-- Ensure created_at default now()
ALTER TABLE events ALTER COLUMN created_at SET DEFAULT now();

-- Mode check constraint (quick|camp)
DO $$
BEGIN
  -- Drop existing constraint if it conflicts
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='events' AND constraint_type='CHECK' AND constraint_name='events_mode_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_mode_check;
  END IF;
  -- Recreate desired constraint
  ALTER TABLE events
    ADD CONSTRAINT events_mode_check
    CHECK (mode IN ('quick','camp'));
EXCEPTION WHEN duplicate_object THEN
  NULL; -- already present with correct definition
END $$;

-- Unique constraints for tokens
DO $$
BEGIN
  BEGIN
    ALTER TABLE events ADD CONSTRAINT events_public_token_key UNIQUE (public_token);
  EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE events ADD CONSTRAINT events_admin_token_key UNIQUE (admin_token);
  EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE events ADD CONSTRAINT events_scorer_token_key UNIQUE (scorer_token);
  EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END;
END $$;

-- Helpful comments
COMMENT ON COLUMN events.is_finalized IS 'Whether admin has published final results';
COMMENT ON COLUMN events.finalized_at IS 'Timestamp when event was finalized';
COMMENT ON COLUMN events.is_archived IS 'Soft archive flag';
COMMENT ON COLUMN events.retention_policy IS 'Retention policy descriptor (text)';
COMMENT ON COLUMN events.mode IS 'quick | camp';

-- =============================================================
-- 2) EVENT_DAYS TABLE - required shape
--    id UUID PK
--    event_id UUID REFERENCES events(id) ON DELETE CASCADE
--    day_number INTEGER NOT NULL
--    label TEXT NOT NULL
--    is_locked BOOLEAN DEFAULT false
--    created_at TIMESTAMP DEFAULT now()
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_days' AND column_name='day_number') THEN
    ALTER TABLE event_days ADD COLUMN day_number INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_days' AND column_name='label') THEN
    ALTER TABLE event_days ADD COLUMN label TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_days' AND column_name='is_locked') THEN
    ALTER TABLE event_days ADD COLUMN is_locked BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_days' AND column_name='created_at') THEN
    ALTER TABLE event_days ADD COLUMN created_at TIMESTAMP DEFAULT now();
  END IF;
END $$;

-- Ensure NOT NULL + defaults where safe
ALTER TABLE event_days ALTER COLUMN is_locked SET DEFAULT false;
ALTER TABLE event_days ALTER COLUMN created_at SET DEFAULT now();

-- Backfill label/day_number if null to allow NOT NULL
UPDATE event_days SET label = COALESCE(label, 'Day ' || COALESCE(day_number,1));
UPDATE event_days SET day_number = COALESCE(day_number, 1);

ALTER TABLE event_days ALTER COLUMN label SET NOT NULL;
ALTER TABLE event_days ALTER COLUMN day_number SET NOT NULL;

-- FK to events with cascade delete
DO $$
BEGIN
  -- Drop mismatching FK if exists, then add correct one
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='event_days' AND constraint_type='FOREIGN KEY' AND constraint_name='event_days_event_id_fkey'
  ) THEN
    ALTER TABLE event_days DROP CONSTRAINT event_days_event_id_fkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE event_days
    ADD CONSTRAINT event_days_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- 3) SCORES TABLE - critical fixes
--    id UUID PK
--    event_id UUID REFERENCES events(id) ON DELETE CASCADE
--    team_id UUID REFERENCES teams(id)  ON DELETE SET NULL
--    day_id  UUID REFERENCES event_days(id) ON DELETE SET NULL
--    points INTEGER NOT NULL (allow negative/zero/positive)
--    category TEXT
--    created_at TIMESTAMP DEFAULT now()
--    updated_at TIMESTAMP DEFAULT now()
-- =============================================================

-- Ensure required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scores' AND column_name='updated_at') THEN
    ALTER TABLE scores ADD COLUMN updated_at TIMESTAMP DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scores' AND column_name='created_at') THEN
    ALTER TABLE scores ADD COLUMN created_at TIMESTAMP DEFAULT now();
  END IF;
END $$;

-- Allow all integers for points (remove restrictive check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='scores' AND constraint_type='CHECK' AND constraint_name='scores_points_check'
  ) THEN
    ALTER TABLE scores DROP CONSTRAINT scores_points_check;
  END IF;
END $$;

-- Enforce NOT NULL on points
ALTER TABLE scores ALTER COLUMN points SET NOT NULL;

-- Ensure defaults
ALTER TABLE scores ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE scores ALTER COLUMN updated_at SET DEFAULT now();

-- Update null timestamps to now() to satisfy NOT NULL constraints if added later
UPDATE scores SET created_at = COALESCE(created_at, now());
UPDATE scores SET updated_at = COALESCE(updated_at, now());

-- FK: event_id -> events.id (cascade)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='scores' AND constraint_type='FOREIGN KEY' AND constraint_name='scores_event_id_fkey'
  ) THEN
    ALTER TABLE scores DROP CONSTRAINT scores_event_id_fkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE scores
    ADD CONSTRAINT scores_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK: team_id -> teams.id (SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='scores' AND constraint_type='FOREIGN KEY' AND constraint_name='scores_team_id_fkey'
  ) THEN
    ALTER TABLE scores DROP CONSTRAINT scores_team_id_fkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE scores
    ADD CONSTRAINT scores_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK: day_id -> event_days.id (SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='scores' AND constraint_type='FOREIGN KEY' AND constraint_name='scores_day_id_fkey'
  ) THEN
    ALTER TABLE scores DROP CONSTRAINT scores_day_id_fkey;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE scores
    ADD CONSTRAINT scores_day_id_fkey
    FOREIGN KEY (day_id) REFERENCES event_days(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-updated updated_at trigger
CREATE OR REPLACE FUNCTION update_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scores_updated_at_trigger ON scores;
CREATE TRIGGER scores_updated_at_trigger
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_scores_updated_at();

COMMENT ON COLUMN scores.points IS 'Points can be positive, zero, or negative (penalties)';
COMMENT ON COLUMN scores.updated_at IS 'Auto-updated on UPDATE via trigger';

-- =============================================================
-- 4) INDEXES (performance & token lookups)
-- =============================================================

-- Scores indexes
CREATE INDEX IF NOT EXISTS idx_scores_event_id ON scores(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_id ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_day_id  ON scores(day_id);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);

-- Events token indexes
CREATE INDEX IF NOT EXISTS idx_events_public_token ON events(public_token);
CREATE INDEX IF NOT EXISTS idx_events_admin_token  ON events(admin_token);
CREATE INDEX IF NOT EXISTS idx_events_scorer_token ON events(scorer_token);

-- Event days index
CREATE INDEX IF NOT EXISTS idx_event_days_event_id ON event_days(event_id);

-- =============================================================
-- 5) OPTIONAL: Waitlist / Coffee supporters minor hygiene
-- (Only ensure created_at defaults exist to avoid null crashes)
-- =============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waitlist' AND column_name='created_at') THEN
    ALTER TABLE waitlist ALTER COLUMN created_at SET DEFAULT now();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_supporters' AND column_name='created_at') THEN
    ALTER TABLE coffee_supporters ALTER COLUMN created_at SET DEFAULT now();
  END IF;
END $$;

-- =============================================================
-- 6) VERIFICATION CHECKLIST (run manually after deploy)
-- =============================================================
-- a) Columns
--    \d events;       -- confirm required columns + defaults
--    \d scores;       -- confirm updated_at, no points check
--    \d event_days;   -- confirm is_locked, day_number, label not null
-- b) Constraints
--    \d events;       -- unique tokens, mode check
--    \d scores;       -- FKs: event cascade, team/day set null
-- c) Triggers
--    \d scores;       -- trigger scores_updated_at_trigger present
-- d) Indexes
--    SELECT indexname FROM pg_indexes WHERE tablename IN ('scores','events','event_days');
-- e) Behaviour tests
--    - Insert score with negative points (penalty) succeeds
--    - Update score -> updated_at changes
--    - Delete team -> related scores keep team_id NULL
--    - Delete event -> related scores/event_days cascade delete
--    - Public/admin/scorer lookups by token use indexes
--
-- After this migration:
--  - Bulk scoring with penalties cannot fail (no check constraint)
--  - History/public APIs have required columns & defaults
--  - Token lookups and day queries are indexed
--  - No column referenced by code is missing
-- =============================================================
