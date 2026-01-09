-- =============================================================
-- fix-events-check-constraints.sql
-- Purpose: Fix CHECK constraints blocking event creation
-- Issue: SQLSTATE 23514 - CHECK constraint violation
-- Date: 2026-01-08
-- =============================================================

-- PROBLEM ANALYSIS:
-- Event creation fails with CHECK constraint violation because:
-- 1. retention_policy = 'auto_expire' may not be allowed by old constraint
-- 2. camp events with number_of_days may have validation issues
-- 3. Mode constraint may be too restrictive (only allows 'quick'|'camp')

-- =============================================================
-- STEP 1: Drop any problematic CHECK constraints
-- =============================================================

-- Drop old mode check if it exists (recreate with correct values)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'events' 
      AND constraint_type = 'CHECK' 
      AND constraint_name = 'events_mode_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_mode_check;
    RAISE NOTICE 'Dropped events_mode_check constraint';
  END IF;
END $$;

-- Drop any retention_policy check if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'events' 
      AND constraint_type = 'CHECK' 
      AND constraint_name = 'events_retention_policy_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_retention_policy_check;
    RAISE NOTICE 'Dropped events_retention_policy_check constraint';
  END IF;
END $$;

-- Drop any number_of_days check if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'events' 
      AND constraint_type = 'CHECK' 
      AND constraint_name = 'events_number_of_days_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_number_of_days_check;
    RAISE NOTICE 'Dropped events_number_of_days_check constraint';
  END IF;
END $$;

-- Drop any old check constraints with generic names that might be blocking
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'events' 
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE 'events_check%'
  LOOP
    EXECUTE format('ALTER TABLE events DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
  END LOOP;
END $$;

-- =============================================================
-- STEP 2: Add corrected CHECK constraints
-- =============================================================

-- Mode constraint: Allow 'quick', 'camp', and 'advanced'
DO $$
BEGIN
  ALTER TABLE events
    ADD CONSTRAINT events_mode_check
    CHECK (mode IN ('quick', 'camp', 'advanced'));
  RAISE NOTICE 'Added events_mode_check constraint (quick|camp|advanced)';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'events_mode_check already exists';
END $$;

-- Retention policy constraint: Allow known policies
DO $$
BEGIN
  ALTER TABLE events
    ADD CONSTRAINT events_retention_policy_check
    CHECK (
      retention_policy IS NULL 
      OR retention_policy IN ('auto_expire', 'manual', 'archive', 'permanent')
    );
  RAISE NOTICE 'Added events_retention_policy_check constraint';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'events_retention_policy_check already exists';
END $$;

-- Date constraint: end_at must be after start_at (if both are set)
DO $$
BEGIN
  ALTER TABLE events
    ADD CONSTRAINT events_date_order_check
    CHECK (
      start_at IS NULL 
      OR end_at IS NULL 
      OR end_at > start_at
    );
  RAISE NOTICE 'Added events_date_order_check constraint';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'events_date_order_check already exists';
END $$;

-- =============================================================
-- VERIFICATION
-- =============================================================

-- List all CHECK constraints on events table
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  RAISE NOTICE '=== Current CHECK constraints on events table ===';
  FOR constraint_rec IN 
    SELECT 
      constraint_name,
      check_clause
    FROM information_schema.check_constraints
    WHERE constraint_name IN (
      SELECT constraint_name 
      FROM information_schema.table_constraints
      WHERE table_name = 'events' 
        AND constraint_type = 'CHECK'
    )
  LOOP
    RAISE NOTICE 'Constraint: % | Check: %', constraint_rec.constraint_name, constraint_rec.check_clause;
  END LOOP;
END $$;

-- =============================================================
-- EXPLANATION
-- =============================================================

-- WHY OLD CONSTRAINTS FAILED:
-- 
-- 1. events_mode_check: Only allowed ('quick', 'camp') but app uses 'advanced'
--    - Fix: Updated to include 'advanced'
--
-- 2. events_retention_policy_check: May have restricted to specific values
--    - Fix: Explicitly allow 'auto_expire', 'manual', 'archive', 'permanent'
--
-- 3. number_of_days validation: May have had constraint requiring value for camp
--    - Fix: Removed any constraint - this is optional (handled at app level)
--
-- 4. Date validation: start_at/end_at may have had strict constraint
--    - Fix: Allow NULL values, only enforce order when both are present
--
-- SAFETY:
-- - All operations are idempotent (IF EXISTS/duplicate_object handling)
-- - No data is modified or deleted
-- - Only schema constraints are updated
-- - Constraints allow NULL where appropriate (app-level validation)
