-- Guarded migration: add CHECK constraints only when relevant columns exist
-- Idempotent and safe across different schemas

-- Add mode constraint if `mode` column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'mode'
  ) THEN
    BEGIN
      ALTER TABLE events
        ADD CONSTRAINT IF NOT EXISTS events_mode_check
        CHECK (mode IN ('quick', 'camp', 'advanced'));
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_mode_check already exists';
    END;
  ELSE
    RAISE NOTICE 'Skipping events_mode_check: column mode not found';
  END IF;
END $$;

-- Add retention policy constraint if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'retention_policy'
  ) THEN
    BEGIN
      ALTER TABLE events
        ADD CONSTRAINT IF NOT EXISTS events_retention_policy_check
        CHECK (
          retention_policy IS NULL
          OR retention_policy IN ('auto_expire', 'manual', 'archive', 'permanent')
        );
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_retention_policy_check already exists';
    END;
  ELSE
    RAISE NOTICE 'Skipping events_retention_policy_check: column retention_policy not found';
  END IF;
END $$;

-- Add date order constraint: try start_at/end_at then start_date/end_date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'start_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'end_at'
  ) THEN
    BEGIN
      ALTER TABLE events
        ADD CONSTRAINT IF NOT EXISTS events_date_order_check
        CHECK (
          start_at IS NULL OR end_at IS NULL OR end_at > start_at
        );
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_date_order_check already exists (start_at/end_at)';
    END;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'start_date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'end_date'
  ) THEN
    BEGIN
      ALTER TABLE events
        ADD CONSTRAINT IF NOT EXISTS events_date_order_check_date
        CHECK (
          start_date IS NULL OR end_date IS NULL OR end_date > start_date
        );
    EXCEPTION WHEN duplicate_object THEN
      RAISE NOTICE 'events_date_order_check_date already exists (start_date/end_date)';
    END;
  ELSE
    RAISE NOTICE 'Skipping date order checks: neither start_at/end_at nor start_date/end_date found';
  END IF;
END $$;

-- Verification: list CHECK constraints (if any)
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  RAISE NOTICE '=== Current CHECK constraints on events table (guarded migration) ===';
  FOR constraint_rec IN 
    SELECT 
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'events' AND tc.constraint_type = 'CHECK'
  LOOP
    RAISE NOTICE 'Constraint: % | Check: %', constraint_rec.constraint_name, constraint_rec.check_clause;
  END LOOP;
END $$;
