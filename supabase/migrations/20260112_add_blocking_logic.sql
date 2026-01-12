-- MIGRATION: ADD BLOCKING LOGIC
-- Description: Adds is_blocked column to profiles and updates RLS to respect it.

-- 1. Add column to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_blocked') THEN
        ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Update get_current_org_id to verify user is NOT blocked
-- We redefine it to return NULL if the user is blocked, which will fail RLS checks.
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles 
  WHERE id = auth.uid() 
  AND is_blocked = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Política específica para profiles
-- Permite que el usuario vea su propio perfil SIEMPRE (para que el frontend chequee is_blocked)
-- Y permite ver otros del mismo org si no está bloqueado.
DROP POLICY IF EXISTS "Profiles viewable by org members" ON profiles;
CREATE POLICY "Profiles viewable by org members" ON profiles
    FOR ALL USING (
        (auth.uid() = id) 
        OR 
        (organization_id = get_current_org_id())
    );

-- Note: Since all other tables (barbers, services, clients, appointments) 
-- already use get_current_org_id() in their policy USING clauses, 
-- updating the function to return NULL for blocked users automatically 
-- blocks their access to ALL business data.
