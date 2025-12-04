-- Migration: Add event templates system
-- Description: Allow users to save event configurations as templates for quick reuse

-- Create templates table
CREATE TABLE IF NOT EXISTS event_templates (
  template_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  event_name_prefix VARCHAR(100) NOT NULL, -- e.g., "Weekly Game Night"
  theme_color VARCHAR(7) NOT NULL DEFAULT '#8B5CF6', -- Hex color code
  logo_url TEXT,
  allow_negative BOOLEAN NOT NULL DEFAULT false,
  display_mode VARCHAR(20) NOT NULL DEFAULT 'total',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_theme_color CHECK (theme_color ~* '^#[0-9A-F]{6}$'),
  CONSTRAINT chk_display_mode CHECK (display_mode IN ('total', 'average', 'last'))
);

-- Create index for faster template lookups by user
CREATE INDEX IF NOT EXISTS idx_templates_user ON event_templates(user_id);

-- Add sample templates (optional)
-- These will only be inserted if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM event_templates LIMIT 1) THEN
    -- You can add sample templates here if needed
    -- INSERT INTO event_templates (user_id, template_name, event_name_prefix, theme_color, allow_negative, display_mode)
    -- VALUES (1, 'Weekly Game Night', 'Game Night', '#8B5CF6', false, 'total');
    NULL; -- Placeholder for future sample data
  END IF;
END $$;
