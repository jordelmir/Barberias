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

async function finalSync() {
    console.log('--- Final Sync: 101 Accounts ---');

    const users = [
        { id: '000000000', email: 'admin@chronos.barber', role: 'ADMIN', orgName: 'Chronos Barberia (Sede Central)' }
    ];

    for (let i = 1; i <= 100; i++) {
        const idStr = i.toString().padStart(3, '0');
        users.push({
            id: i.toString(),
            email: `admin.barber.${idStr}@chronos.app`,
            role: 'BARBER',
            orgName: `Barber Shop ${idStr}`
        });
    }

    let fixCount = 0;
    for (const u of users) {
        // 1. Get Profile
        const { data: profile } = await supabase.from('profiles').select('id, organization_id').eq('email', u.email).maybeSingle();
        if (!profile) {
            console.log(`⚠️ Profile missing for ${u.email}`);
            continue;
        }

        // 2. Ensure identification is set in profile
        await supabase.from('profiles').update({ identification: u.id, role: u.role }).eq('id', profile.id);

        // 3. Ensure Barber entry exists
        const { data: barber } = await supabase.from('barbers').select('id').eq('profile_id', profile.id).maybeSingle();

        if (!barber) {
            const { error: insErr } = await supabase.from('barbers').insert({
                organization_id: profile.organization_id,
                profile_id: profile.id,
                name: u.role === 'ADMIN' ? 'Super Admin' : `Admin ${u.orgName}`,
                email: u.email,
                identification: u.id,
                is_admin: u.role === 'ADMIN'
            });
            if (insErr) {
                console.error(`❌ Error inserting barber for ${u.email}:`, insErr.message);
            } else {
                console.log(`✅ Created barber for ${u.email}`);
                fixCount++;
            }
        } else {
            // Update identification just in case
            await supabase.from('barbers').update({ identification: u.id }).eq('profile_id', profile.id);
            // console.log(`⏩ Barber exists for ${u.email}`);
        }
    }

    console.log(`--- Sync Completed. Fixed ${fixCount} barber entries. ---`);
}

finalSync();
