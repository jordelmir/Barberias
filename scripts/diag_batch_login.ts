import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to check everything
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBatchUser(id: string) {
    console.log(`--- Testing Batch User ID: ${id} ---`);

    // 1. Check RPC resolution
    const { data: resolved, error: rpcError } = await supabase.rpc('get_email_by_identification', {
        target_id: id
    });
    console.log('RPC Resolution:', { data: resolved, error: rpcError });

    if (resolved && resolved.length > 0) {
        const email = resolved[0].email;
        console.log(`✅ Email resolved to: ${email}`);

        // 2. Check Profile status
        const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
        console.log('Profile Data:', profile);

        // 3. Check Barber record
        const { data: barber } = await supabase.from('barbers').select('*').eq('profile_id', profile?.id).single();
        console.log('Barber Record:', barber);

        // 4. Try LOGIN with known password "000000" (from scorched_earth_fix)
        console.log('🔑 Attempting login with "000000"...');
        const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!);
        const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
            email: email,
            password: '000000'
        });

        if (authError) {
            console.error('❌ Login FAILED:', authError.message);
        } else {
            console.log('✅ Login SUCCESS! User ID:', authData.user?.id);
        }
    } else {
        console.error('❌ Failed to resolve email for ID:', id);
    }
}

testBatchUser('1'); // Test the first batch user
