-- ============================================
-- RENDER POSTGRESQL SETUP
-- Game Count System - Complete Database Schema
-- 
-- INSTRUCTIONS:
-- 1. Go to Render Dashboard: https://dashboard.render.com
-- 2. Select your PostgreSQL database (game_count_system)
-- 3. Click "Connect" -> "External Connection" -> "PSQL Command"
-- 4. Or use the "Shell" tab in Render dashboard
-- 5. Copy and paste this ENTIRE file
-- 6. Press Enter to execute
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (with Authentication Fields)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    last_login TIMESTAMP
);

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, event_id)
);

-- ============================================
-- 4. GAME SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS game_scores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, game_number, event_id)
);

-- ============================================
-- 5. SHARE LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. REFRESH TOKENS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 7. USER SESSIONS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. AUDIT LOGS TABLE (Security)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_total_points ON teams(total_points);

-- Game scores indexes
CREATE INDEX IF NOT EXISTS idx_game_scores_team_id ON game_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_event_id ON game_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_number ON game_scores(game_number);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at);

-- Share links indexes
CREATE INDEX IF NOT EXISTS idx_share_links_event_id ON share_links(event_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);

-- Refresh tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite index for unique game scores
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_scores_unique ON game_scores(team_id, game_number, event_id);

-- ============================================
-- CHECK CONSTRAINTS
-- ============================================

-- Points range constraints
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
-- TRIGGERS FOR AUTO-CALCULATION
-- ============================================

-- Function to recalculate team total points
CREATE OR REPLACE FUNCTION recalculate_team_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE teams
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM game_scores
        WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.team_id, OLD.team_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_recalculate_team_points ON game_scores;

-- Create trigger for INSERT, UPDATE, DELETE on game_scores
CREATE TRIGGER trigger_recalculate_team_points
AFTER INSERT OR UPDATE OR DELETE ON game_scores
FOR EACH ROW
EXECUTE FUNCTION recalculate_team_total_points();

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED TOKENS
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired refresh tokens
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired share links
    DELETE FROM share_links
    WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
    
    -- Clear expired verification tokens
    UPDATE users
    SET verification_token = NULL,
        verification_token_expires = NULL
    WHERE verification_token_expires < CURRENT_TIMESTAMP;
    
    -- Clear expired password reset tokens
    UPDATE users
    SET password_reset_token = NULL,
        password_reset_expires = NULL
    WHERE password_reset_expires < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show created tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show table row counts
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'game_scores', COUNT(*) FROM game_scores
UNION ALL
SELECT 'share_links', COUNT(*) FROM share_links
UNION ALL
SELECT 'refresh_tokens', COUNT(*) FROM refresh_tokens
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- All 8 tables created with:
-- ✓ Primary keys (TEXT with UUID)
-- ✓ Foreign key relationships
-- ✓ Indexes for performance
-- ✓ Check constraints for data integrity
-- ✓ Triggers for auto-calculation
-- ✓ Cleanup functions for maintenance
-- ============================================
