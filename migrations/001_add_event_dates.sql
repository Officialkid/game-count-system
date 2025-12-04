-- Migration: Add start_date and end_date columns to events table
-- This allows events to have optional date ranges for scheduling and auto-deactivation

ALTER TABLE events
ADD COLUMN start_date DATE NULL,
ADD COLUMN end_date DATE NULL;

-- Add a check constraint to ensure end_date is after start_date
ALTER TABLE events
ADD CONSTRAINT check_event_dates 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Create an index on end_date for efficient querying of expired events
CREATE INDEX idx_events_end_date ON events(end_date) WHERE end_date IS NOT NULL;
