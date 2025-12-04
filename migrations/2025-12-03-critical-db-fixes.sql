-- Critical DB Consistency Fixes Migration
-- Remove duplicates, add unique constraints, fix triggers, add indexes, and updated_at columns

BEGIN;

-- Remove duplicates, keep latest
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY team_id, game_number, event_id
        ORDER BY created_at DESC
    ) as rn
    FROM game_scores
)
DELETE FROM game_scores
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
ALTER TABLE game_scores
ADD CONSTRAINT IF NOT EXISTS unique_team_game_event_score
UNIQUE (team_id, game_number, event_id);

-- Add composite index for upserts and lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_scores_event_team_game_unique 
ON game_scores(team_id, game_number, event_id);

-- Add index for submission_id
CREATE INDEX IF NOT EXISTS idx_game_scores_submission_id 
ON game_scores(submission_id)
WHERE submission_id IS NOT NULL;

-- Add check constraints
ALTER TABLE events
DROP CONSTRAINT IF EXISTS check_display_mode;
ALTER TABLE events
ADD CONSTRAINT check_display_mode 
CHECK (display_mode IN ('cumulative', 'per_day', 'individual_games'));

ALTER TABLE events
ADD CONSTRAINT IF NOT EXISTS check_num_teams_range
CHECK (num_teams >= 2 AND num_teams <= 50);

ALTER TABLE game_scores
ADD CONSTRAINT IF NOT EXISTS check_game_number_positive
CHECK (game_number >= 1);

-- Add updated_at columns and triggers
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_users_updated_at') THEN
    CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_events_updated_at') THEN
    CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_teams_updated_at') THEN
    CREATE TRIGGER trigger_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_share_links_updated_at') THEN
    CREATE TRIGGER trigger_share_links_updated_at
    BEFORE UPDATE ON share_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Fix triggers for total_points recalculation
CREATE OR REPLACE FUNCTION update_team_points_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE teams
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM game_scores
        WHERE team_id = NEW.team_id
    )
    WHERE id = NEW.team_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_team_points_on_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE teams
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM game_scores
        WHERE team_id = NEW.team_id
    )
    WHERE id = NEW.team_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_team_points_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE teams
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM game_scores
        WHERE team_id = OLD.team_id
    )
    WHERE id = OLD.team_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recalculate all existing totals
UPDATE teams t
SET total_points = (
    SELECT COALESCE(SUM(gs.points), 0)
    FROM game_scores gs
    WHERE gs.team_id = t.id
);

COMMIT;