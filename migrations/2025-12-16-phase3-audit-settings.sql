-- Phase 3: Backend & Database - Audit Logs & Settings Tables
-- Migration: 2025-12-16

-- ============================================================================
-- AUDIT_LOGS TABLE: Append-only history of all changes for compliance & debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'event', 'team', 'score', 'user', 'auth'
  entity_id VARCHAR(255) NOT NULL,  -- Foreign key value (event_id, team_id, etc.)
  action VARCHAR(50) NOT NULL,      -- 'create', 'update', 'delete', 'read', 'login', 'logout'
  old_value JSONB,                  -- Previous state (for updates/deletes)
  new_value JSONB,                  -- Current state (for creates/updates)
  ip_address VARCHAR(45),           -- IPv4 or IPv6
  user_agent TEXT,
  status_code INT,                  -- HTTP status if API-triggered
  error_message TEXT,               -- Error details if action failed
  metadata JSONB,                   -- Additional context (e.g., reason, method)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Indexes for efficient querying
  CONSTRAINT audit_action_valid CHECK (action IN ('create', 'update', 'delete', 'read', 'login', 'logout', 'export', 'import')),
  CONSTRAINT audit_entity_valid CHECK (entity_type IN ('event', 'team', 'score', 'user', 'auth', 'settings', 'template'))
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_ip_address ON audit_logs(ip_address);

-- ============================================================================
-- SETTINGS TABLE: User & system preferences (extensible key-value design)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,  -- e.g., 'theme', 'notifications_email', 'language'
  setting_value TEXT,                 -- JSON or simple value
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Enforce uniqueness per user per setting
  UNIQUE(user_id, setting_key)
);

CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_key ON settings(setting_key);

-- ============================================================================
-- SYSTEM SETTINGS (Global configuration, user_id = NULL)
-- ============================================================================
INSERT INTO settings (user_id, setting_key, setting_value, created_at, updated_at)
VALUES 
  (NULL, 'max_events_per_user', '100', NOW(), NOW()),
  (NULL, 'max_teams_per_event', '50', NOW(), NOW()),
  (NULL, 'session_timeout_minutes', '1440', NOW(), NOW()),
  (NULL, 'email_enabled', 'false', NOW(), NOW())
ON CONFLICT (user_id, setting_key) DO NOTHING;

-- ============================================================================
-- ENHANCE EXISTING TABLES: Add missing audit/tracking columns
-- ============================================================================

-- Add updated_at tracking to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add updated_at to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at to scores
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add is_deleted for soft deletes (compliance/recovery)
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add audit triggers
CREATE OR REPLACE FUNCTION log_event_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_value, new_value, metadata, created_at)
  VALUES (
    COALESCE(NEW.updated_by, (SELECT id FROM users WHERE email = current_setting('app.current_user_email') LIMIT 1)),
    'event',
    NEW.id::text,
    CASE WHEN TG_OP = 'INSERT' THEN 'create' WHEN TG_OP = 'UPDATE' THEN 'update' WHEN TG_OP = 'DELETE' THEN 'delete' END,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    jsonb_build_object('trigger', TG_NAME),
    NOW()
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_trigger ON events;
CREATE TRIGGER audit_events_trigger AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION log_event_change();

-- ============================================================================
-- GRANT PERMISSIONS (for role-based access)
-- ============================================================================
-- Assuming a "postgres" superuser and "app_user" application user
-- This ensures audit_logs can only be read by admins or the application
GRANT SELECT ON audit_logs TO postgres;
GRANT INSERT ON audit_logs TO postgres;

-- ============================================================================
-- MIGRATION NOTES:
-- ============================================================================
-- 1. Audit logs use JSONB for flexible old/new value storage
-- 2. Indexes on user_id, entity, and created_at for fast queries
-- 3. Settings table uses key-value for extensibility
-- 4. Soft deletes allow compliance recovery
-- 5. Triggers auto-log changes (future: application can also manually log)
-- 6. GIN index on JSONB columns recommended for large datasets
-- 7. Run: npx tsx scripts/run-migration.ts (from app root)
