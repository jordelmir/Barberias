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
    const email = 'admin.barber.001@chronos.app';
    const password = 'Chronos.LSP9PEYF!';

    console.log(`Testing login for ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login Error:', error.message);
    } else {
        console.log('✅ Login Success! User ID:', data.user?.id);

        // Attempt to fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user?.id)
            .maybeSingle();

        if (profileError) {
            console.error('❌ Profile Fetch Error:', profileError.message);
        } else if (!profile) {
            console.error('❌ Profile Not Found!');
        } else {
            console.log('✅ Profile Found:', JSON.stringify(profile, null, 2));

            // Check RLS resolution
            const { data: resolvedOrg, error: rpcError } = await supabase.rpc('get_current_org_id');
            if (rpcError) {
                console.error('❌ RPC get_current_org_id Error:', rpcError.message);
            } else {
                console.log('✅ Resolved Org ID via RPC:', resolvedOrg);
                if (resolvedOrg !== profile.organization_id) {
                    console.error('⚠️ Mismatch! Resolved Org does not match Profile Org.');
                }
            }
        }
    }
}

testLogin();
