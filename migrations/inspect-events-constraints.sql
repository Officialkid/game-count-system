-- =============================================================
-- inspect-events-constraints.sql
-- Purpose: Identify which CHECK constraint is blocking inserts
-- Usage: Run on Render PostgreSQL to see current constraints
-- =============================================================

-- Show all columns in events table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Show all CHECK constraints on events table with their definitions
SELECT 
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'events' 
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.constraint_name;

-- Show all constraints (including UNIQUE, FK, etc.)
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'events'
ORDER BY constraint_type, constraint_name;
