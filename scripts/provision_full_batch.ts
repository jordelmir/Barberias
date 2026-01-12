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

async function provisionAllUsers() {
    console.log('--- Batch Provisioning 101 Accounts (Robust Mode) ---');

    // 1. Super Admin
    const superAdmin = {
        id: '000000000',
        email: 'admin@chronos.barber',
        password: '000000',
        role: 'ADMIN',
        orgName: 'Chronos Barberia (Sede Central)'
    };

    const usersToProvision = [superAdmin];

    // 2. 100 Barberías
    for (let i = 1; i <= 100; i++) {
        const idStr = i.toString().padStart(3, '0');
        usersToProvision.push({
            id: i.toString(),
            email: `admin.barber.${idStr}@chronos.app`,
            password: `Chronos.2026!${idStr}`,
            role: 'BARBER',
            orgName: `Barber Shop ${idStr}`
        });
    }

    // Get all groups and organizations to avoid multiple queries
    const { data: orgs } = await supabase.from('organizations').select('id, name');
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    let successCount = 0;
    for (const u of usersToProvision) {
        process.stdout.write(`[${successCount + 1}/101] Processing ${u.id} | ${u.email}... `);

        try {
            // a. Find or create Organization
            let org = orgs?.find(o => o.name === u.orgName);
            if (!org) {
                const { data: newOrg, error: orgErr } = await supabase.from('organizations').insert({ name: u.orgName }).select().single();
                if (orgErr) { console.error(`Err Org ${u.email}:`, orgErr.message); continue; }
                org = newOrg;
                orgs?.push(org);
            }

            // b. Find or create Auth User
            let authUser = authUsers.find(a => a.email === u.email);
            if (!authUser) {
                const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
                    email: u.email,
                    password: u.password,
                    email_confirm: true,
                    user_metadata: { identification: u.id, name: u.role === 'ADMIN' ? 'Super Admin' : `Admin ${u.orgName}` }
                });
                if (authErr && !authErr.message.includes('already been registered')) {
                    console.error(`Err Auth ${u.email}:`, authErr.message);
                    continue;
                }
                if (newUser?.user) {
                    authUser = newUser.user;
                } else {
                    // Fetch all users again if needed (expensive but robust)
                    const { data: { users: refreshedUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                    authUser = refreshedUsers.find(a => a.email === u.email);
                }
            } else {
                // Update password and metadata
                await supabase.auth.admin.updateUserById(authUser.id, {
                    password: u.password,
                    user_metadata: { identification: u.id, name: u.role === 'ADMIN' ? 'Super Admin' : `Admin ${u.orgName}` }
                });
            }

            if (!authUser) { console.error(`Failed to find/create ${u.email}`); continue; }

            // c. Update/Upsert Profile with Identification
            const { error: profErr } = await supabase.from('profiles').upsert({
                id: authUser.id,
                organization_id: org.id,
                email: u.email,
                role: u.role === 'ADMIN' ? 'ADMIN' : 'BARBER',
                name: u.role === 'ADMIN' ? 'Super Admin' : `Administrador ${u.orgName}`,
                identification: u.id,
                is_blocked: false
            });
            if (profErr) { console.error(`Err Prof ${u.email}:`, profErr.message); continue; }

            // d. Update/Insert Barber entry (Manual Upsert)
            const { data: existingBarber } = await supabase.from('barbers').select('id').eq('profile_id', authUser.id).maybeSingle();

            if (existingBarber) {
                const { error: barbUpdateErr } = await supabase.from('barbers').update({
                    organization_id: org.id,
                    name: u.role === 'ADMIN' ? 'Super Admin' : `Administrador ${u.orgName}`,
                    email: u.email,
                    identification: u.id,
                    is_admin: u.role === 'ADMIN'
                }).eq('profile_id', authUser.id);
                if (barbUpdateErr) { console.error(`Err Barb Update ${u.email}:`, barbUpdateErr.message); continue; }
            } else {
                const { error: barbInsertErr } = await supabase.from('barbers').insert({
                    organization_id: org.id,
                    profile_id: authUser.id,
                    name: u.role === 'ADMIN' ? 'Super Admin' : `Administrador ${u.orgName}`,
                    email: u.email,
                    identification: u.id,
                    is_admin: u.role === 'ADMIN'
                });
                if (barbInsertErr) { console.error(`Err Barb Insert ${u.email}:`, barbInsertErr.message); continue; }
            }

            successCount++;
            console.log('✅');
        } catch (err: any) {
            console.error(`Unexpected Error processing ${u.email}:`, err.message);
        }
    }

    console.log(`\n--- Provisioning Completed. Successfully processed ${successCount} users. ---`);
}

provisionAllUsers();
