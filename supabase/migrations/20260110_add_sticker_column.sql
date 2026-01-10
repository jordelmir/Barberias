-- Add sticker column to barbers and clients
ALTER TABLE barbers ADD COLUMN sticker TEXT;
ALTER TABLE clients ADD COLUMN sticker TEXT;
