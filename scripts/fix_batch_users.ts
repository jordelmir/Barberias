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

async function getBatchUsers() {
    let allUsers: any[] = [];
    let page = 1;
    while (true) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        if (users.length === 0) break;
        allUsers = allUsers.concat(users);
        if (users.length < 1000) break;
        page++;
    }
    return allUsers.filter(u => u.email?.includes('admin.barber') || u.email === 'admin@chronos.barber');
}

async function checkBatch() {
    console.log('--- Verifying All Admin Users ---');

    const batchUsers = await getBatchUsers();
    console.log(`Found ${batchUsers.length} admin users in auth.users.`);

    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
    if (profileError) throw profileError;

    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id');
    if (orgError) throw orgError;

    const orgIds = new Set(orgs.map(o => o.id));

    console.log(`Found ${profiles?.length || 0} profiles and ${orgs?.length || 0} organizations.`);

    let missingProfiles = 0;
    let blockedProfiles = 0;
    let invalidOrgs = 0;

    for (const u of batchUsers) {
        const profile = profiles?.find(p => p.id === u.id);
        if (!profile) {
            missingProfiles++;
        } else {
            if (profile.is_blocked) blockedProfiles++;
            if (!orgIds.has(profile.organization_id)) invalidOrgs++;
        }
    }

    console.log(`Summary:
    - Total Admin Users: ${batchUsers.length}
    - Missing Profiles: ${missingProfiles}
    - Blocked Profiles: ${blockedProfiles}
    - Invalid Orgs: ${invalidOrgs}`);

    if (missingProfiles > 0 || blockedProfiles > 0 || invalidOrgs > 0) {
        console.log('\n--- Attempting Auto-Fix ---');
        for (const u of batchUsers) {
            const profile = profiles?.find(p => p.id === u.id);
            if (!profile || profile.is_blocked || !orgIds.has(profile.organization_id)) {

                let targetOrgId = profile?.organization_id;

                if (!profile || !orgIds.has(targetOrgId)) {
                    const i = u.email?.split('.')[2]?.split('@')[0];
                    const orgName = u.email === 'admin@chronos.barber' ? 'Chronos Barberia (Sede Central)' : `Barberia Premium #${i}`;

                    const { data: existingOrg } = await supabase.from('organizations').select('id').eq('name', orgName).maybeSingle();

                    if (existingOrg) {
                        targetOrgId = existingOrg.id;
                    } else {
                        const { data: newOrg } = await supabase.from('organizations').insert({ name: orgName }).select().single();
                        targetOrgId = newOrg?.id;
                    }
                }

                if (targetOrgId) {
                    await supabase.from('profiles').upsert({
                        id: u.id,
                        email: u.email,
                        organization_id: targetOrgId,
                        role: 'ADMIN',
                        name: 'Administrador Principal',
                        is_blocked: false
                    });
                    console.log(`✅ Fixed profile for ${u.email}`);
                }
            }
        }
        console.log('Auto-fix completed.');
    }
}

checkBatch();
