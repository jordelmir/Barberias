import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    console.log('--- 🔍 DEEP DIAGNOSTIC: IDENTIFICATION MAPPING ---');

    // 1. Check RPC existence and output
    console.log('Testing RPC get_email_by_identification for "1"...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_email_by_identification', { target_id: '1' });
    if (rpcError) {
        console.error('❌ RPC Error:', rpcError.message);
    } else {
        console.log('✅ RPC Resolution Success:', rpcData);
    }

    // 2. Direct Table check for Barbers
    console.log('Checking barbers table for identification "1"...');
    const { data: barberData, error: barberError } = await supabase.from('barbers').select('*').eq('identification', '1').maybeSingle();
    if (barberError) {
        console.error('❌ Barber fetch error:', barberError.message);
    } else if (barberData) {
        console.log('✅ Barber found:', { id: barberData.id, email: barberData.email, identification: barberData.identification });
    } else {
        console.warn('⚠️ Barber NOT found for identification "1"');
    }

    // 3. Direct Table check for Profiles
    if (barberData) {
        console.log('Checking profile for barber profile_id:', barberData.profile_id);
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', barberData.profile_id).maybeSingle();
        console.log('Profile Details:', profileData ? { id: profileData.id, email: profileData.email, is_blocked: profileData.is_blocked } : 'NOT FOUND');
    }

    // 4. Check IDs 1-5 summary
    const { data: allSamples } = await supabase.from('barbers').select('identification, email').in('identification', ['1', '2', '3', '4', '5']).order('identification');
    console.log('IDs 1-5 Summary:', allSamples);
}

check();
