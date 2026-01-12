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

async function check() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    console.log('--- All Users ---');
    users.forEach(u => {
        console.log(`- ID: ${u.id}, Email: "${u.email}", Confirmed: ${u.email_confirmed_at}, Banned Until: ${u.banned_until}, Deleted At: ${u.deleted_at}`);
    });

    const manager = users.find(u => u.email?.includes('admin@chronos.barber'));
    if (manager) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', manager.id).single();
        console.log('\nManager Profile:', profile);
    }
}

check();
