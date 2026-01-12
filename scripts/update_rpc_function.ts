import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: any = {};
envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const adminClient = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});

async function updateRPCFunction() {
    console.log('--- Updating get_email_by_identification function ---');

    const sql = `
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
    `.trim();

    console.log('SQL to execute:');
    console.log(sql);
    console.log('');
    console.log('⚠️  Please run this SQL in Supabase Dashboard > SQL Editor');
    console.log('');
}

updateRPCFunction();
