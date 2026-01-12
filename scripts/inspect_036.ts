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

async function inspect036() {
    console.log('--- Inspecting Account 036 ---');
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('identification', '36')
        .maybeSingle();

    if (pError) console.error('Profile Error:', pError);
    else console.log('Profile 36:', profile);

    const { data: barber, error: bError } = await supabase
        .from('barbers')
        .select('*')
        .eq('identification', '36')
        .maybeSingle();

    if (bError) console.error('Barber Error:', bError);
    else console.log('Barber 36:', barber);
}

inspect036();
