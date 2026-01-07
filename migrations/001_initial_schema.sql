-- GameScore Initial Schema
-- Token-based event scoring system (no user auth)

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('quick', 'camp', 'advanced')),
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NULL,
    retention_policy TEXT NOT NULL CHECK (retention_policy IN ('auto_expire', 'manual', 'archive')),
    expires_at TIMESTAMP NULL,
    admin_token TEXT UNIQUE NOT NULL,
    scorer_token TEXT UNIQUE NOT NULL,
    public_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'archived')),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Event days (for multi-day camp events)
CREATE TABLE IF NOT EXISTS event_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    label TEXT NULL,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (event_id, day_number)
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NULL,
    avatar_url TEXT NULL,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (event_id, name)
);

-- Scores
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    day_id UUID NULL REFERENCES event_days(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    points INT NOT NULL CHECK (points >= 0),
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_admin_token ON events(admin_token);
CREATE INDEX IF NOT EXISTS idx_events_scorer_token ON events(scorer_token);
CREATE INDEX IF NOT EXISTS idx_events_public_token ON events(public_token);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_expires_at ON events(expires_at);

CREATE INDEX IF NOT EXISTS idx_event_days_event_id ON event_days(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_event_id ON scores(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_id ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_day_id ON scores(day_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
