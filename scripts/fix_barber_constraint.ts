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

async function addUniqueConstraint() {
    console.log('--- Adding Unique Constraint to barbers(profile_id) ---');

    // Check if constraint already exists
    const checkSql = `
        SELECT count(*) 
        FROM pg_constraint 
        WHERE conname = 'barbers_profile_id_key';
    `;

    const { data: countData, error: countErr } = await supabase.rpc('exec_sql', { sql_query: checkSql });

    // Since exec_sql might return different formats, we'll try to just run the alter table with IF NOT EXISTS logic
    const sql = `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'barbers_profile_id_key'
            ) THEN 
                ALTER TABLE barbers ADD CONSTRAINT barbers_profile_id_key UNIQUE (profile_id);
            END IF; 
        END $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('❌ Error adding constraint:', error.message);
        console.log('You might need to run this manually in Supabase Dashboard SQL Editor:');
        console.log('ALTER TABLE barbers ADD CONSTRAINT barbers_profile_id_key UNIQUE (profile_id);');
    } else {
        console.log('✅ Unique constraint ensured on barbers(profile_id)');
    }
}

addUniqueConstraint();
