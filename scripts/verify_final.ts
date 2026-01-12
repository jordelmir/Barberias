import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const credentialsPath = path.resolve(process.cwd(), 'sales_credentials_v2.md');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

async function verify() {
    console.log('--- 🔍 FINAL SYSTEM VERIFICATION ---');

    // 1. Check RPC for ID '1'
    const { data: res, error: e } = await supabase.rpc('get_email_by_identification', { target_id: '1' });
    console.log('ID 1 Resolution:', res?.[0]?.email || '❌ FAILED');

    // 2. Count Barbers
    const { count: bCount } = await supabase.from('barbers').select('*', { count: 'exact', head: true });
    console.log('Total Barbers in DB:', bCount);

    // 3. Test Auth for a few samples
    const samples = [
        { id: '1', email: 'admin.barber.001@chronos.app', pass: 'Chronos.LSP9PEYF!' },
        { id: '10', email: 'admin.barber.009@chronos.app', pass: 'Chronos.8L8YNVXX!' },
        { id: 'MASTER', email: 'admin@chronos.barber', pass: '000000' }
    ];

    const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!);

    for (const sample of samples) {
        process.stdout.write(`Testing Login [${sample.email}]: `);
        const { data, error } = await authClient.auth.signInWithPassword({
            email: sample.email,
            password: sample.pass
        });

        if (data.user) {
            process.stdout.write('✅ SUCCESS\n');
        } else {
            process.stdout.write(`❌ FAILED (${error?.message})\n`);
        }
    }
}

verify();
