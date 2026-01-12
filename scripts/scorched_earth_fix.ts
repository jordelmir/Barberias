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

const credentialsPath = path.resolve(process.cwd(), 'sales_credentials_v2.md');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

async function fixEverything() {
    console.log('--- 🚀 STARTING SCORCHED EARTH BATCH FIX ---');

    // 1. Parse all users from credentials file
    const lines = credentials.split('\n').filter(l => l.includes('@chronos.'));
    const targetUsers: any[] = [];

    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 5) return;

        const idStr = parts[1].replace(/\*\*/g, ''); // "MASTER" or "1"
        const email = parts[3].replace(/\*\*/g, '');
        const password = parts[4].replace(/`/g, '');

        if (email && password) {
            targetUsers.push({ idStr, email, password });
        }
    });

    console.log(`Found ${targetUsers.length} target users to fix.`);

    // 2. Pre-fetch all auth users and profiles
    const { data: { users: allAuth } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const { data: allProfiles } = await supabase.from('profiles').select('*');
    const { data: allBarbers } = await supabase.from('barbers').select('*');

    for (const [idx, target] of targetUsers.entries()) {
        const authUser = allAuth?.find(u => u.email === target.email);
        if (!authUser) {
            // console.log(`[${idx+1}] ❌ User ${target.email} not found in auth.users.`);
            continue;
        }

        process.stdout.write(`[${idx + 1}/${targetUsers.length}] Fixing ${target.email}... `);

        try {
            // A. Force Password Sync
            await supabase.auth.admin.updateUserById(authUser.id, { password: target.password });

            // B. Fix Profile (is_blocked = false)
            await supabase.from('profiles').update({ is_blocked: false }).eq('id', authUser.id);

            // C. Fix Barber (Identification)
            const identification = target.idStr === 'MASTER' ? '000000000' : target.idStr;

            const existingBarber = allBarbers?.find(b => b.profile_id === authUser.id);
            if (existingBarber) {
                await supabase.from('barbers').update({ identification }).eq('id', existingBarber.id);
            } else {
                const profile = allProfiles?.find(p => p.id === authUser.id);
                if (profile) {
                    await supabase.from('barbers').insert({
                        organization_id: profile.organization_id,
                        profile_id: authUser.id,
                        name: 'Administrador Principal',
                        email: target.email,
                        identification,
                        tier: 'MASTER',
                        is_admin: true
                    });
                }
            }

            process.stdout.write(`✅\n`);
        } catch (err: any) {
            process.stdout.write(`❌ Error: ${err.message}\n`);
        }
    }

    console.log('\n--- ✨ BATCH FIX COMPLETED ---');
}

fixEverything();
