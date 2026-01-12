-- FIX: RECURSIVE RLS POLICY ON PROFILES
-- Problem: The original policy used `get_current_org_id()` which queries `profiles`, creating a loop.
-- Solution: Allow users to read their OWN profile record directly using `auth.uid()`.

-- 1. Drop the restrictive policy if it conflicts (or add a new permissive one alongside it)
-- Note: Policies are additive (OR), so adding a specific one for "Own Profile" is safe and sufficient.

CREATE POLICY "Users can always view their own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Performance: Add Index on `profiles.id` (Primary Key is already indexed, but good to be explicit for RLS if needed, though PK is usually enough).
-- Skipping explicit index on PK.

-- 3. (Optional) Fix for Barbers table if needed
-- If Barbers table also needs self-read access for profile checks:
CREATE POLICY "Barbers can view their own record" ON barbers
    FOR SELECT
    USING (auth.uid() = profile_id);
