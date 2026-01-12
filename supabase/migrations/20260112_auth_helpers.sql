-- Helper to find email by identification (Security Definer to bypass RLS for this specific lookup)
CREATE OR REPLACE FUNCTION get_email_by_identification(target_id text)
RETURNS TABLE (email text) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check barbers first (Staff/Admins)
    RETURN QUERY 
    SELECT p.email 
    FROM profiles p
    JOIN barbers b ON b.profile_id = p.id
    WHERE b.identification = target_id
    LIMIT 1;

    -- If not found, check clients
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT c.email
        FROM clients c
        WHERE c.identification = target_id
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant EXECUTE to authenticated and anon (since it's used at login)
GRANT EXECUTE ON FUNCTION get_email_by_identification(text) TO anon;
GRANT EXECUTE ON FUNCTION get_email_by_identification(text) TO authenticated;
