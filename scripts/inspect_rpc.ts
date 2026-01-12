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

async function listRPCs() {
    const { data, error } = await supabase.rpc('inspect_rpc'); // If this fails, we try another way
    if (error) {
        console.error('Error listing RPCs:', error.message);
        // Try querying information_schema if possible
        const { data: qData, error: qError } = await supabase.from('_rpc_list').select('*').limit(1); // dummy
        console.log('Trying alternative...');
    } else {
        console.log('RPCs:', data);
    }
}

listRPCs();
