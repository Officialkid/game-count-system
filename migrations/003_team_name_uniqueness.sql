-- Migration: Add team name uniqueness constraint
-- Created: 2025-12-05
-- Purpose: Enforce unique team names within each event and fix existing duplicates

-- Step 1: Find and fix existing duplicates by appending numbers
DO $$
DECLARE
    duplicate_record RECORD;
    new_name TEXT;
    counter INTEGER;
BEGIN
    -- Loop through all duplicate team names within each event
    FOR duplicate_record IN 
        SELECT event_id, team_name, array_agg(id ORDER BY id) as team_ids
        FROM teams
        GROUP BY event_id, LOWER(team_name)
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first team with original name, rename others
        counter := 2;
        FOR i IN 2..array_length(duplicate_record.team_ids, 1)
        LOOP
            -- Generate unique name
            new_name := duplicate_record.team_name || ' ' || counter;
            
            -- Check if this name already exists, increment until unique
            WHILE EXISTS (
                SELECT 1 FROM teams 
                WHERE event_id = duplicate_record.event_id 
                AND LOWER(team_name) = LOWER(new_name)
            ) LOOP
                counter := counter + 1;
                new_name := duplicate_record.team_name || ' ' || counter;
            END LOOP;
            
            -- Update the duplicate team name
            UPDATE teams 
            SET team_name = new_name
            WHERE id = duplicate_record.team_ids[i];
            
            RAISE NOTICE 'Renamed duplicate team from "%" to "%" in event %', 
                duplicate_record.team_name, new_name, duplicate_record.event_id;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Finished renaming duplicate teams';
END $$;

-- Step 2: Add unique constraint on (event_id, team_name) - case-insensitive
-- First, create a unique index with LOWER() for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_event_name_unique 
ON teams (event_id, LOWER(team_name));

-- Add comment for documentation
COMMENT ON INDEX idx_teams_event_name_unique IS 
'Ensures team names are unique within each event (case-insensitive)';

-- Step 3: Verify constraint is working
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT event_id, LOWER(team_name), COUNT(*) as cnt
        FROM teams
        GROUP BY event_id, LOWER(team_name)
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Still found % duplicate team names after migration!', duplicate_count;
    ELSE
        RAISE NOTICE 'Migration successful: No duplicate team names found';
    END IF;
END $$;

-- Step 4: Add index for performance on team name lookups
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_name_lower ON teams(LOWER(team_name));

COMMENT ON INDEX idx_teams_event_id IS 'Improves team lookup performance by event';
COMMENT ON INDEX idx_teams_name_lower IS 'Improves duplicate checking performance';
