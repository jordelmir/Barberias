-- Add sticker column to profiles, barbers, and clients
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sticker') THEN
        ALTER TABLE profiles ADD COLUMN sticker TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'barbers' AND column_name = 'sticker') THEN
        ALTER TABLE barbers ADD COLUMN sticker TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'sticker') THEN
        ALTER TABLE clients ADD COLUMN sticker TEXT;
    END IF;
END $$;

-- Create an RPC to safely create a user (Barber/Client) with a PIN
-- This requires high privileges, so it should be run by an admin or via an Edge Function.
-- However, for this environment, we might already have a helper or we use a specific pattern.
-- Let's define a safe_create_user RPC if possible, or just ensure the columns exist first.
