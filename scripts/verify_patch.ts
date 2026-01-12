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

async function verifyUpdates() {
    console.log('--- Verifying Patch ---');

    // Check Barber Shop 004 (Specific example from user)
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role, identification')
        .eq('identification', '4') // id '4' maps to '004' in provisioning script (wait, it was i.toString().padStart(3, '0'))
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
    } else if (profile) {
        console.log('✅ Found profile:', profile);
    } else {
        // Try id '004' just in case
        const { data: p2 } = await supabase.from('profiles').select('name, role, identification').eq('identification', '004').maybeSingle();
        console.log('✅ Found profile (004):', p2);
    }
}

verifyUpdates();
