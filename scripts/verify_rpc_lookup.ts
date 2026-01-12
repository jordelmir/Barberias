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

async function verifyLoginLogic() {
    console.log('--- Verifying Identification Lookup RPC ---');

    const testCases = [
        { id: '000000000', expectedEmail: 'admin@chronos.barber' },
        { id: '1', expectedEmail: 'admin.barber.001@chronos.app' },
        { id: '100', expectedEmail: 'admin.barber.100@chronos.app' }
    ];

    for (const test of testCases) {
        process.stdout.write(`Looking up ID: ${test.id}... `);
        const { data: result, error } = await supabase.rpc('get_email_by_identification', { target_id: test.id });
        if (error) {
            console.error('❌ RPC Error:', error.message);
        } else if (result && result[0] && result[0].email === test.expectedEmail) {
            console.log(`✅ Success! Found ${result[0].email}`);
        } else {
            console.warn(`⚠️ Mismatch! Found "${JSON.stringify(result)}" but expected "${test.expectedEmail}"`);
        }
    }
}

verifyLoginLogic();
