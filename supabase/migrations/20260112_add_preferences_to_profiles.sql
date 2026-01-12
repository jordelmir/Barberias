-- Migration: Add preferences to profiles table
-- Date: 2026-01-12

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Optional: Comments for documentation
COMMENT ON COLUMN profiles.preferences IS 'Stores visual preferences and style technical sheet for all users.';
