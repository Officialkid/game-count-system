-- Migration: Add onboarding tutorial status to users
-- Adds persistence for tutorial completion and progress

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Optional: backfill existing users as completed if needed
UPDATE users SET onboarding_completed = TRUE WHERE onboarding_completed IS NULL;
