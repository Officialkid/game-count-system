-- Drop coffee supporters table (cleanup)
-- This is destructive; run only if you intend to remove internal tipping system.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'coffee_supporters'
  ) THEN
    DROP TABLE coffee_supporters CASCADE;
  END IF;
END $$;
