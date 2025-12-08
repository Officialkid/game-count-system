-- Migration: Multi-Admin Management System
-- Date: 2025-12-05
-- Description: Add support for multiple admins per event with role-based permissions

-- Create event_admins table for managing multiple administrators per event
CREATE TABLE IF NOT EXISTS event_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'judge', 'scorer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Create indexes for fast lookups
CREATE INDEX idx_event_admins_event ON event_admins(event_id);
CREATE INDEX idx_event_admins_user ON event_admins(user_id);
CREATE INDEX idx_event_admins_role ON event_admins(event_id, role);

-- Create admin_invitations table for invitation flow
CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  invitee_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'judge', 'scorer')),
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for invitations
CREATE INDEX idx_admin_invitations_token ON admin_invitations(token);
CREATE INDEX idx_admin_invitations_email ON admin_invitations(invitee_email);
CREATE INDEX idx_admin_invitations_event ON admin_invitations(event_id);
CREATE INDEX idx_admin_invitations_status ON admin_invitations(status);

-- Create admin_activity_log for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_role VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity log queries
CREATE INDEX idx_admin_activity_event ON admin_activity_log(event_id, created_at DESC);
CREATE INDEX idx_admin_activity_admin ON admin_activity_log(admin_id, created_at DESC);
CREATE INDEX idx_admin_activity_action ON admin_activity_log(action);

-- Migrate existing events to have owner admin entries
-- This creates admin records for all existing event creators
INSERT INTO event_admins (event_id, user_id, role, accepted_at)
SELECT id, user_id, 'owner', CURRENT_TIMESTAMP
FROM events
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Add trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_admin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_admins_timestamp
BEFORE UPDATE ON event_admins
FOR EACH ROW
EXECUTE FUNCTION update_admin_timestamp();

CREATE TRIGGER update_admin_invitations_timestamp
BEFORE UPDATE ON admin_invitations
FOR EACH ROW
EXECUTE FUNCTION update_admin_timestamp();

-- Add comments for documentation
COMMENT ON TABLE event_admins IS 'Stores multiple administrators per event with role-based permissions';
COMMENT ON TABLE admin_invitations IS 'Manages invitation flow for adding new event administrators';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for all admin actions on events';

COMMENT ON COLUMN event_admins.role IS 'Owner: full control, Admin: manage teams/scores, Judge: add scores only, Scorer: add scores with restrictions';
COMMENT ON COLUMN admin_invitations.token IS 'Unique invitation token sent via email for accepting admin role';
COMMENT ON COLUMN admin_invitations.expires_at IS 'Invitation expires after 7 days by default';
COMMENT ON COLUMN admin_activity_log.details IS 'JSON payload with action-specific details (before/after values, affected entities)';
