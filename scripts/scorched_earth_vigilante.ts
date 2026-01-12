import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const credentialsPath = path.resolve(process.cwd(), 'sales_credentials_v2.md');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

async function fixEverything() {
    console.log('--- 🚀 STARTING RIGOROUS BATCH FIX ---');

    const lines = credentials.split('\n').filter(l => l.includes('@chronos.'));
    const targetUsers: any[] = [];

    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 5) return;
        const idStr = parts[1].replace(/\*\*/g, '');
        const email = parts[3].replace(/\*\*/g, '');
        const password = parts[4].replace(/`/g, '');
        if (email && password) targetUsers.push({ idStr, email, password });
    });

    console.log(`Found ${targetUsers.length} target users.`);

    for (const [idx, target] of targetUsers.entries()) {
        process.stdout.write(`[${idx + 1}/${targetUsers.length}] ${target.email}: `);

        try {
            // 1. Get User
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            const user = users.find(u => u.email === target.email);

            if (!user) {
                process.stdout.write('❌ Auth user not found\n');
                continue;
            }

            // 2. Sync Password
            const { error: authError } = await supabase.auth.admin.updateUserById(user.id, { password: target.password });
            if (authError) throw new Error(`Auth sync: ${authError.message}`);

            // 3. Unblock
            const { error: profError } = await supabase.from('profiles').update({ is_blocked: false }).eq('id', user.id);
            if (profError) throw new Error(`Profile fix: ${profError.message}`);

            // 4. Identification in Barbers
            const identification = target.idStr === 'MASTER' ? '000000000' : target.idStr;
            const { data: bData, error: bErrorCheck } = await supabase.from('barbers').select('*').eq('profile_id', user.id).single();

            if (bErrorCheck && bErrorCheck.code !== 'PGRST116') throw new Error(`Barber check: ${bErrorCheck.message}`);

            if (bData) {
                const { error: upError } = await supabase.from('barbers').update({ identification }).eq('id', bData.id);
                if (upError) throw new Error(`Barber update (id=${identification}): ${upError.message}`);
            } else {
                // Fetch profile to get org_id
                const { data: pData } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
                if (pData) {
                    const { error: inError } = await supabase.from('barbers').insert({
                        organization_id: pData.organization_id,
                        profile_id: user.id,
                        name: target.idStr === 'MASTER' ? 'Admin Master' : `Barbero ${target.idStr}`,
                        email: target.email,
                        identification,
                        tier: 'MASTER',
                        is_admin: true
                    });
                    if (inError) throw new Error(`Barber insert (id=${identification}): ${inError.message}`);
                }
            }

            process.stdout.write('✅\n');
        } catch (err: any) {
            process.stdout.write(`❌ ${err.message}\n`);
        }
    }
}

fixEverything();
