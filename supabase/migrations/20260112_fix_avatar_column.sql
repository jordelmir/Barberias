-- Rename avatar_url to avatar for consistency with frontend types
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles RENAME COLUMN avatar_url TO avatar;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'barbers' AND column_name = 'avatar_url') THEN
        ALTER TABLE barbers RENAME COLUMN avatar_url TO avatar;
    END IF;

    -- Ensure clients table also has the avatar column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'avatar') THEN
        ALTER TABLE clients ADD COLUMN avatar TEXT;
    END IF;
END $$;
