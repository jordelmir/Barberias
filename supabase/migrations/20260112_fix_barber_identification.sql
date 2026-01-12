-- MIGRATION: ADD IDENTIFICATION TO BARBERS
-- Description: Adds the identification column to the barbers table for login resolution.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='barbers' AND column_name='identification') THEN
        ALTER TABLE barbers ADD COLUMN identification TEXT;
        -- Create an index for performance
        CREATE INDEX IF NOT EXISTS idx_barbers_identification ON barbers(identification);
    END IF;
END $$;
