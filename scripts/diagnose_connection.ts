
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Supabase Connection Diagnostics ---');
console.log('URL:', supabaseUrl || '❌ MISSING');
console.log('Anon Key:', supabaseAnonKey ? '✅ PRESENT (truncated: ' + supabaseAnonKey.substring(0, 10) + '...)' : '❌ MISSING');
console.log('Service Role Key:', serviceRoleKey ? '✅ PRESENT' : '❌ MISSING (Required for admin scripts only)');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERROR: Essential Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runDiagnostics() {
    console.log('\nTesting connection...');

    // 1. Test basic reachability
    const { data: healthData, error: healthError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (healthError) {
        console.error('❌ Database Reachability Failed:', healthError.message);
    } else {
        console.log('✅ Database reachable (Profiles table exists).');
    }

    // 2. Test Auth Service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
        console.error('❌ Auth Service Error:', authError.message);
    } else {
        console.log('✅ Auth service responsive.');
    }

    console.log('\n--- Diagnostics Complete ---');
}

runDiagnostics().catch(err => {
    console.error('Unhandled diagnostic error:', err);
    process.exit(1);
});
