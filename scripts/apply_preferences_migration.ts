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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
`;

async function applyMigration() {
    console.log('--- Applying Profile Preferences Migration ---');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        if (error.message.includes('function rpc.exec_sql() does not exist')) {
            console.error('❌ Error: RPC function "exec_sql" not found. Please run the SQL manually in Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.error('❌ Migration Error:', error.message);
        }
    } else {
        console.log('✅ Migration applied successfully.');
    }
}

applyMigration();
