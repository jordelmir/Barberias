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

async function reprovision() {
    const email = 'admin.barber.001@chronos.app';
    const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found in auth.users');
        return;
    }

    console.log(`Re-provisioning profile for ${email} (ID: ${user.id})...`);

    // 1. Get current org (if exists)
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).maybeSingle();
    let orgId = profile?.organization_id;

    if (!orgId) {
        // Find org by name
        const { data: org } = await supabase.from('organizations').select('id').eq('name', 'Barberia Premium #001').maybeSingle();
        orgId = org?.id;
    }

    if (!orgId) {
        console.error('Could not find organization for test user');
        return;
    }

    // 2. Delete and Upsert
    await supabase.from('profiles').delete().eq('id', user.id);
    const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        organization_id: orgId,
        email: email,
        role: 'ADMIN',
        name: 'Administrador Principal',
        is_blocked: false
    });

    if (error) {
        console.error('Re-provision failed:', error.message);
    } else {
        console.log('✅ Re-provisioned successfully.');
    }
}

reprovision();
