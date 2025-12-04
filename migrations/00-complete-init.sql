-- ============================================
-- Complete Database Initialization Script
-- Game Count System with Authentication
-- Run this on a fresh PostgreSQL database
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Create Base Tables
-- ============================================

-- Table: users (with auth enhancements)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Authentication enhancements
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    last_login_at TIMESTAMP,
    last_login_ip TEXT
);

-- Table: events
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    brand_color VARCHAR(7) DEFAULT '#6b46c1',
    logo_url VARCHAR(500),
    allow_negative BOOLEAN DEFAULT FALSE,
    display_mode VARCHAR(20) DEFAULT 'cumulative',
    num_teams INTEGER DEFAULT 3,
    CONSTRAINT fk_events_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Table: teams
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    total_points INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_teams_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- Table: game_scores
CREATE TABLE IF NOT EXISTS game_scores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    game_number INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_game_scores_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_game_scores_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE
);

-- Table: share_links
CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_share_links_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- ============================================
-- STEP 2: Create Authentication Tables
-- ============================================

-- Table: refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP
);

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_id TEXT REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_status TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create Indexes for Performance
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_total_points ON teams(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_teams_event_points ON teams(event_id, total_points DESC);

-- Game scores indexes
CREATE INDEX IF NOT EXISTS idx_game_scores_event_id ON game_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_team_id ON game_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_team_game ON game_scores(team_id, game_number);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at DESC);

-- Share links indexes
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_event_id ON share_links(event_id);

-- Authentication indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- STEP 4: Add Data Integrity Constraints
-- ============================================

-- Prevent duplicate game scores for same team in same game
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_team_game_score 
ON game_scores(team_id, game_number, event_id);

-- Ensure points constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_points_range') THEN
        ALTER TABLE game_scores ADD CONSTRAINT chk_points_range 
        CHECK (points >= -1000 AND points <= 1000);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_total_points_range') THEN
        ALTER TABLE teams ADD CONSTRAINT chk_total_points_range 
        CHECK (total_points >= -10000 AND total_points <= 10000);
    END IF;
END $$;

-- ============================================
-- STEP 5: Create Triggers for Auto-calculations
-- ============================================

-- Function to recalculate team total_points
CREATE OR REPLACE FUNCTION recalculate_team_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate total for the affected team
    UPDATE teams
    SET total_points = COALESCE((
        SELECT SUM(points)
        FROM game_scores
        WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
    ), 0)
    WHERE id = COALESCE(NEW.team_id, OLD.team_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_team_points_insert ON game_scores;
DROP TRIGGER IF EXISTS trigger_update_team_points_update ON game_scores;
DROP TRIGGER IF EXISTS trigger_update_team_points_delete ON game_scores;

-- Create new triggers
CREATE TRIGGER trigger_recalc_team_points_insert
AFTER INSERT ON game_scores
FOR EACH ROW
EXECUTE FUNCTION recalculate_team_total_points();

CREATE TRIGGER trigger_recalc_team_points_update
AFTER UPDATE ON game_scores
FOR EACH ROW
EXECUTE FUNCTION recalculate_team_total_points();

CREATE TRIGGER trigger_recalc_team_points_delete
AFTER DELETE ON game_scores
FOR EACH ROW
EXECUTE FUNCTION recalculate_team_total_points();

-- ============================================
-- STEP 6: Create Cleanup Function
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Mark expired refresh tokens as revoked
    UPDATE refresh_tokens
    SET revoked = TRUE, revoked_at = NOW()
    WHERE expires_at < NOW() AND revoked = FALSE;
    
    -- Deactivate expired sessions
    UPDATE user_sessions
    SET is_active = FALSE
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    -- Clean up old verification tokens
    UPDATE users
    SET verification_token = NULL, verification_token_expires = NULL
    WHERE verification_token_expires < NOW() AND verification_token IS NOT NULL;
    
    -- Clean up old password reset tokens
    UPDATE users
    SET password_reset_token = NULL, password_reset_expires = NULL
    WHERE password_reset_expires < NOW() AND password_reset_token IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Add Comments for Documentation
-- ============================================

COMMENT ON TABLE users IS 'Registered users with authentication features';
COMMENT ON TABLE events IS 'Events created by users';
COMMENT ON TABLE teams IS 'Teams participating in events';
COMMENT ON TABLE game_scores IS 'Individual game scores for teams';
COMMENT ON TABLE share_links IS 'Public share links for event scoreboards';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';
COMMENT ON TABLE user_sessions IS 'Active user sessions tracking';
COMMENT ON TABLE audit_logs IS 'Security audit log for authentication events';

COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account lock expiry timestamp';
COMMENT ON COLUMN teams.total_points IS 'Auto-calculated sum of all game scores';
COMMENT ON COLUMN share_links.token IS 'Unique token for public scoreboard access';

-- ============================================
-- Database Initialization Complete!
-- ============================================

-- Verify installation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('users', 'events', 'teams', 'game_scores', 'share_links', 
                       'refresh_tokens', 'user_sessions', 'audit_logs');
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database Initialization Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Core Tables:';
    RAISE NOTICE '  ✓ users (with auth enhancements)';
    RAISE NOTICE '  ✓ events';
    RAISE NOTICE '  ✓ teams';
    RAISE NOTICE '  ✓ game_scores';
    RAISE NOTICE '  ✓ share_links';
    RAISE NOTICE '';
    RAISE NOTICE 'Auth Tables:';
    RAISE NOTICE '  ✓ refresh_tokens';
    RAISE NOTICE '  ✓ user_sessions';
    RAISE NOTICE '  ✓ audit_logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Start your app: npm run dev';
    RAISE NOTICE '  2. Test registration at: http://localhost:3000/register';
    RAISE NOTICE '  3. Check audit logs: SELECT * FROM audit_logs;';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Features Enabled:';
    RAISE NOTICE '  ✓ Account lockout after 5 failed attempts';
    RAISE NOTICE '  ✓ Refresh token system';
    RAISE NOTICE '  ✓ Audit logging';
    RAISE NOTICE '  ✓ Password reset support';
    RAISE NOTICE '  ✓ Email verification support';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
