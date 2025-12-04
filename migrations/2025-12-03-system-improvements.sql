-- ============================================
-- System Improvements Migration
-- Adds status, metadata, and new features
-- ============================================

-- Add event status tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE events ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add user avatar support
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Enhance share_links table
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP; -- NULL means never expires

-- Add team avatars and metadata
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add score metadata
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS added_by TEXT; -- user_id who added the score
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS game_name TEXT; -- Optional game name like "Round 1", "Final"

-- Create event templates table
CREATE TABLE IF NOT EXISTS event_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    theme_color VARCHAR(50) DEFAULT 'purple',
    allow_negative BOOLEAN DEFAULT FALSE,
    display_mode VARCHAR(20) DEFAULT 'cumulative',
    num_teams INTEGER DEFAULT 3,
    team_names TEXT[], -- Array of team names
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_templates_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON share_links(is_active);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_game_scores_added_by ON game_scores(added_by);
CREATE INDEX IF NOT EXISTS idx_game_scores_updated_at ON game_scores(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_templates_user_id ON event_templates(user_id);

-- Add trigger to update updated_at on events
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_scores_updated_at BEFORE UPDATE ON game_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN events.status IS 'Status of the event: active, completed, archived';
COMMENT ON COLUMN share_links.is_active IS 'Whether the share link is currently active';
COMMENT ON COLUMN share_links.expires_at IS 'When the link expires (NULL = never expires)';
COMMENT ON COLUMN game_scores.is_edited IS 'Whether the score has been edited after creation';
COMMENT ON COLUMN game_scores.game_name IS 'Optional friendly name for the game (e.g., Round 1, Finals)';
