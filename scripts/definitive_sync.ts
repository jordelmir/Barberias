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

async function getOrCreateOrg(name: string) {
    const { data, error } = await supabase.from('organizations').select('id').eq('name', name).maybeSingle();
    if (data) return data.id;

    // Fallback: use a generic org if missing, or create it
    const { data: newOrg, error: inError } = await supabase.from('organizations').insert({ name }).select().single();
    if (inError) {
        // Find ANY org if we can't create one
        const { data: anyOrg } = await supabase.from('organizations').select('id').limit(1).single();
        return anyOrg?.id;
    }
    return newOrg?.id;
}

async function runSyc() {
    console.log('--- 🛡️ DEFINITIVE AUTH SYNC START ---');

    // 1. Get ALL Auth Users (Paginated up to 1000)
    console.log('Fetching all auth users...');
    const { data: { users: allAuth }, error: authListError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authListError) {
        console.error('❌ Failed to list auth users:', authListError.message);
        return;
    }
    console.log(`Found ${allAuth.length} existing users in auth.`);

    // 2. Parse targets
    const lines = credentials.split('\n').filter(l => l.includes('@chronos.'));
    const targets: any[] = [];
    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 5) return;
        const idStr = parts[1].replace(/\*\*/g, '');
        const orgName = parts[2].replace(/\*\*/g, '');
        const email = parts[3].replace(/\*\*/g, '');
        const password = parts[4].replace(/`/g, '');
        if (email && password) targets.push({ idStr, orgName, email, password });
    });

    for (const [idx, target] of targets.entries()) {
        process.stdout.write(`[${idx + 1}/${targets.length}] ${target.email}: `);

        try {
            let authUser = allAuth.find(u => u.email === target.email);

            // A. CREATE AUTH USER IF MISSING
            if (!authUser) {
                const { data: created, error: createError } = await supabase.auth.admin.createUser({
                    email: target.email,
                    password: target.password,
                    email_confirm: true,
                    user_metadata: { name: `Admin ${target.idStr}`, role: 'ADMIN' }
                });
                if (createError) {
                    process.stdout.write(`❌ Create failed: ${createError.message}\n`);
                    continue;
                }
                authUser = created.user;
                process.stdout.write('🆕 AUTH ');
            } else {
                // UPDATE PASSWORD just in case
                await supabase.auth.admin.updateUserById(authUser.id, { password: target.password });
                process.stdout.write('🔄 PASS ');
            }

            // B. FIX PROFILE
            const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
            let orgId = profile?.organization_id;

            if (!profile) {
                orgId = await getOrCreateOrg(target.orgName);
                const { error: inProf } = await supabase.from('profiles').insert({
                    id: authUser.id,
                    organization_id: orgId,
                    email: target.email,
                    name: target.idStr === 'MASTER' ? 'Admin Master' : `Admin Barber ${target.idStr}`,
                    role: 'ADMIN',
                    is_blocked: false
                });
                if (inProf) throw new Error(`Profile insert: ${inProf.message}`);
                process.stdout.write('🆕 PROF ');
            } else {
                await supabase.from('profiles').update({ is_blocked: false }).eq('id', authUser.id);
                process.stdout.write('✅ PROF ');
            }

            // C. FIX BARBER (with Identification)
            const identification = target.idStr === 'MASTER' ? '000000000' : target.idStr;
            const { data: barber } = await supabase.from('barbers').select('*').eq('profile_id', authUser.id).maybeSingle();

            if (!barber) {
                const { error: inBarb } = await supabase.from('barbers').insert({
                    organization_id: orgId,
                    profile_id: authUser.id,
                    name: target.idStr === 'MASTER' ? 'Admin Master' : `Admin Barber ${target.idStr}`,
                    email: target.email,
                    identification,
                    tier: 'MASTER',
                    is_admin: true
                });
                if (inBarb) {
                    process.stdout.write(`❌ Barber insert error (might be missing column): ${inBarb.message}\n`);
                } else {
                    process.stdout.write('🆕 BARB\n');
                }
            } else {
                const { error: upBarb } = await supabase.from('barbers').update({ identification }).eq('id', barber.id);
                if (upBarb) {
                    process.stdout.write(`❌ Barber update error (might be missing column): ${upBarb.message}\n`);
                } else {
                    process.stdout.write('✅ BARB\n');
                }
            }

        } catch (err: any) {
            process.stdout.write(`❌ ERROR: ${err.message}\n`);
        }
    }

    console.log('--- ✨ SYNC COMPLETED ---');
}

runSyc();
