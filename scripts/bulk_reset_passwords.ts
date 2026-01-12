import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function bulkReset() {
    console.log('--- 🚀 BULK CREDENTIAL RESET: 100 BATCH USERS ---');

    // 1. Get all users
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
        console.error('❌ Error listing users:', error.message);
        return;
    }

    let successCount = 0;

    for (let i = 1; i <= 100; i++) {
        const indexStr = i.toString().padStart(3, '0');
        const email = `admin.barber.${indexStr}@chronos.app`;
        const newPassword = `Chronos.2026!${indexStr}`; // Predictable and working pattern

        const user = users.find(u => u.email === email);
        if (user) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                password: newPassword,
                email_confirm: true
            });

            if (updateError) {
                console.error(`❌ Failed to update ${email}:`, updateError.message);
            } else {
                // Also ensure profile is unblocked
                await supabase.from('profiles').update({ is_blocked: false }).eq('id', user.id);
                successCount++;
                if (i % 10 === 0) console.log(`Processed ${i}/100 users...`);
            }
        } else {
            console.warn(`⚠️ User not found: ${email}`);
        }
    }

    console.log(`\n✅ Successfully updated ${successCount} users to pattern 'Chronos.2026!XXX'`);
}

bulkReset();
