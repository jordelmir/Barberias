-- Helper to find email by identification (Security Definer to bypass RLS for this specific lookup)
CREATE OR REPLACE FUNCTION get_email_by_identification(target_id text)
RETURNS TABLE (email text) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check barbers and profiles (Staff/Admins)
    RETURN QUERY 
    SELECT p.email 
    FROM profiles p
    JOIN barbers b ON b.profile_id = p.id
    WHERE b.identification = target_id
    LIMIT 1;
    
    -- Note: Clients table doesn't have identification column
    -- Clients should login with email directly
END;
$$ LANGUAGE plpgsql;

-- Grant EXECUTE to authenticated and anon (since it's used at login)
GRANT EXECUTE ON FUNCTION get_email_by_identification(text) TO anon;
GRANT EXECUTE ON FUNCTION get_email_by_identification(text) TO authenticated;
