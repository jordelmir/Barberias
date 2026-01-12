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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    const email = 'admin@chronos.barber';
    const newPassword = '000000';

    console.log(`--- Fixing User: ${email} ---`);

    // 1. Find user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('User NOT FOUND');
        return;
    }

    console.log(`User ID: ${user.id}`);

    // 2. Reset Password
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword, email_confirm: true }
    );

    if (updateError) {
        console.error('Error updating password:', updateError.message);
    } else {
        console.log('✅ Password reset to "000000" and email confirmed.');
    }

    // 3. Ensure Profile exists and is correct
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) {
        console.log('Creating missing profile...');
        await supabase.from('profiles').insert({
            id: user.id,
            email: email,
            role: 'ADMIN',
            name: 'Gerente General',
            organization_id: '4e865e94-0baa-411e-8306-0c9992e5aac7'
        });
    } else {
        console.log('Profile exists:', profile.role);
        // Ensure role is ADMIN
        if (profile.role !== 'ADMIN') {
            await supabase.from('profiles').update({ role: 'ADMIN' }).eq('id', user.id);
            console.log('Updated role to ADMIN');
        }
    }

    console.log('--- Fix Complete ---');
}

fix();
