-- Add Branding Columns to Events Table
-- Run this migration to add theme color and logo support

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(50) DEFAULT 'purple',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_theme_color ON events(theme_color);

-- Comment on columns
COMMENT ON COLUMN events.theme_color IS 'Color theme identifier (purple, blue, green, orange, red, pink, professional, ocean, sunset, forest)';
COMMENT ON COLUMN events.logo_url IS 'URL to uploaded event logo (PNG/JPG)';

-- Verify changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('theme_color', 'logo_url');
