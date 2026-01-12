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

const credentialsPath = path.resolve(process.cwd(), 'sales_credentials_v2.md');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

async function testAll() {
    console.log('--- Parsing Users ---');
    const lines = credentials.split('\n').filter(l => l.includes('@chronos.barber') || l.includes('@chronos.app'));

    const users: any[] = [];
    lines.forEach(line => {
        // Extract email (bolded or plain) and password (backticked)
        const emailMatch = line.match(/\*\*([^\*]+)\*\*/);
        const passwordMatch = line.match(/`([^`]+)`/);

        if (emailMatch && passwordMatch) {
            users.push({
                email: emailMatch[1],
                password: passwordMatch[1]
            });
        }
    });

    console.log(`Testing ${users.length} admin users...`);

    let successes = 0;
    let authFailures = 0;
    let profileFailures = 0;

    // Test a sample of the last 10
    const sample = users.slice(-10);

    for (const [idx, user] of sample.entries()) {
        process.stdout.write(`[${idx + 1}/${sample.length}] Checking ${user.email}... `);

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
        });

        if (authError) {
            process.stdout.write(`❌ Auth Error: ${authError.message}\n`);
            authFailures++;
            continue;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user?.id)
            .single();

        if (profileError) {
            process.stdout.write(`❌ Profile Error: ${profileError.message}\n`);
            profileFailures++;
        } else {
            process.stdout.write(`✅ Success\n`);
            successes++;
        }

        await supabase.auth.signOut();
    }

    console.log(`\nFinal Summary:
    - Sample Size: ${sample.length}
    - Total Successes: ${successes}
    - Auth Failures: ${authFailures}
    - Profile Failures: ${profileFailures}`);
}

testAll();
