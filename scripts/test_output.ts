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

async function testOutput() {
    console.log('--- Testing Output ---');
    console.log('Env URL:', env.VITE_SUPABASE_URL);
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (error) console.error('Error:', error.message);
    else console.log('Successfully listed 1 user:', users[0]?.email);
    console.log('--- Test Completed ---');
}

testOutput();
