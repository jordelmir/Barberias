import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function diag() {
    console.log('--- 🛡️ PRODUCTION AUTH DIAGNOSTIC ---');

    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
        console.error('❌ List Users Error:', error.message);
        return;
    }

    console.log('Total Auth Users:', users.length);

    const targetEmail = 'admin.barber.001@chronos.app';
    const u1 = users.find(u => u.email === targetEmail);

    if (u1) {
        console.log(`✅ User ${targetEmail} FOUND.`);
        console.log('   ID:', u1.id);
        console.log('   Confirmed At:', u1.email_confirmed_at);
        console.log('   Metadata:', u1.user_metadata);
    } else {
        console.warn(`⚠️ User ${targetEmail} NOT FOUND in first 1000 users.`);
        const similar = users.filter(u => u.email?.includes('001@'));
        console.log('   Similar emails found:', similar.map(u => u.email));
    }

    const masterEmail = 'admin@chronos.barber';
    const um = users.find(u => u.email === masterEmail);
    if (um) {
        console.log(`✅ Master ${masterEmail} FOUND.`);
        console.log('   ID:', um.id);
    } else {
        console.warn(`⚠️ Master ${masterEmail} NOT FOUND.`);
    }
}

diag();
