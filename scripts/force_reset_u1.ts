import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function forceReset() {
    const email = 'admin.barber.001@chronos.app';
    const password = 'Chronos.LSP9PEYF!';

    console.log(`--- 🛠️ FORCE RESETTING ${email} ---`);

    // 1. Find User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ User not found in Auth.');
        return;
    }

    // 2. Update Password and Confirm
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password: password,
        email_confirm: true
    });

    if (error) {
        console.error('❌ Reset Error:', error.message);
    } else {
        console.log('✅ User Reset successfully (Password sync + Confirmed).');
        console.log('User ID:', user.id);
        console.log('Email Confirmed:', data.user.email_confirmed_at);
    }

    // 3. Ensure unblocked in profile
    const { error: pError } = await supabase.from('profiles').update({ is_blocked: false }).eq('id', user.id);
    if (pError) console.error('❌ Profile Error:', pError.message);
    else console.log('✅ Profile unblocked.');
}

forceReset();
