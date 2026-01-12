import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260112_fix_barber_identification.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('--- Applying Migration: Fix Barber Identification ---');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); // Assuming exec_sql helper exists, or use direct direct query

    if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('exec_sql not found, trying another way or assuming migration is manual.');
            console.log('Wait, I can just use the supabase admin client to query or better yet, a script that does individual updates if needed.');
        } else {
            console.error('❌ Migration failed:', error.message);
            return;
        }
    } else {
        console.log('✅ Migration applied successfully!');
    }
}

// Alternative if exec_sql doesn't exist: check if column exists, if not, add it
async function ensureColumn() {
    console.log('Checking columns for barbers...');
    const { data, error } = await supabase.from('barbers').select('*').limit(1);

    if (error) {
        console.error('Error selecting from barbers:', error.message);
        return;
    }

    const hasId = data && data.length > 0 ? ('identification' in data[0]) : false;

    if (!hasId) {
        console.log('Column "identification" missing. I cannot add it without psql or exec_sql RPC.');
        console.log('However, I can check if I have a "pg_query" RPC or similar.');
    } else {
        console.log('Column "identification" already exists.');
    }
}

// Since I am an agent, I can assume I might have already provided a run_sql helper in some other migration?
// If not, I'll recommend the user to run it in the SQL Editor.

applyMigration();
