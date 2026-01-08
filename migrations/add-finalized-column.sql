-- Add is_finalized column to events table
-- This column tracks whether the admin has officially published final results

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

-- Add finalized_at timestamp to track when event was finalized
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;

-- Add index for querying finalized events
CREATE INDEX IF NOT EXISTS idx_events_is_finalized ON events(is_finalized);

-- Update comment
COMMENT ON COLUMN events.is_finalized IS 'Whether admin has published final results';
COMMENT ON COLUMN events.finalized_at IS 'Timestamp when event was finalized';
