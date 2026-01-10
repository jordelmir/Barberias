-- Enable Realtime for the appointments table
-- This allows the frontend to listen for INSERT/UPDATE/DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Optional: Enable for other tables if needed, but appointments is the critical one
-- ALTER PUBLICATION supabase_realtime ADD TABLE barbers;
