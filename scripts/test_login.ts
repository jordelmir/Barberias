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

async function testLogin() {
    console.log('--- Testing Login ---');

    const testCases = [
        { email: 'jordelmir1@gmail.com', password: '937383', label: 'Email + Password' },
        { email: '73812570', password: '937383', label: 'ID + Password (via RPC)' }
    ];

    for (const test of testCases) {
        console.log(`\nTesting: ${test.label}`);
        console.log(`  Email/ID: ${test.email}`);
        console.log(`  Password: ${test.password}`);

        let loginEmail = test.email;

        // If not an email, try to resolve via RPC
        if (!test.email.includes('@')) {
            const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_email_by_identification', {
                target_id: test.email
            });

            if (rpcError) {
                console.log(`  ❌ RPC Error: ${rpcError.message}`);
                continue;
            }

            if (resolvedEmail && resolvedEmail.length > 0) {
                loginEmail = resolvedEmail[0].email;
                console.log(`  ✅ Resolved to: ${loginEmail}`);
            } else {
                console.log(`  ❌ No email found for ID: ${test.email}`);
                continue;
            }
        }

        // Try to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: test.password
        });

        if (error) {
            console.log(`  ❌ Login failed: ${error.message}`);
        } else {
            console.log(`  ✅ Login successful!`);
            console.log(`  User ID: ${data.user.id}`);
            console.log(`  Email: ${data.user.email}`);

            // Sign out
            await supabase.auth.signOut();
        }
    }
}

testLogin();
