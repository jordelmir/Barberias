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

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runDiag() {
    const email = 'admin.barber.001@chronos.app';
    const password = 'Chronos.LSP9PEYF!';

    console.log(`Logging in as ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Login failed:', error.message);
        return;
    }

    const token = data.session?.access_token;
    console.log('Got JWT. Calling diagnostic function...');

    const diagUrl = `${env.VITE_SUPABASE_URL}/functions/v1/diag-auth-rls`;
    const response = await fetch(diagUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
    });

    const result = await response.json();
    console.log('Diagnostic Result:', JSON.stringify(result, null, 2));
}

runDiag();
