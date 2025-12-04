-- Migration: Add status column to events table
-- This allows tracking active vs inactive events for auto-deactivation

ALTER TABLE events
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Create an index on status for efficient filtering
CREATE INDEX idx_events_status ON events(status);

-- Add a comment explaining the status column
COMMENT ON COLUMN events.status IS 'Event status: active (can accept scores) or inactive (read-only)';
