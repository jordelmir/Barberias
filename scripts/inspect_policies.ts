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

async function inspect() {
    console.log('--- Inspecting RLS Policies for "profiles" ---');

    // We'll use a direct query via a safe RPC if possible, 
    // but since we don't know if 'sql' exists, we'll try to use a common one or just check the schema.

    const { data: policies, error } = await supabase
        .rpc('sql', { q: "SELECT policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles'" })
        .catch(() => ({ data: null, error: { message: 'RPC sql not found' } }));

    if (error || !policies) {
        console.log('RPC "sql" failed or not found. Trying another way...');
        // Let's try to just read the migrations or something?
        // Actually, let's just create a temporary RPC to run this query if we have to.
    } else {
        console.log('Policies found:', JSON.stringify(policies, null, 2));
    }
}

inspect();
