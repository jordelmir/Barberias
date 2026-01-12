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

async function verifySpecificUser() {
    const email = 'admin.barber.003@chronos.app';

    console.log(`--- Verifying User by Email: ${email} ---`);

    // 1. Get user by email
    // Note: listUsers is paginated, better to use a direct find if possible or scan all pages
    let allUsers: any[] = [];
    let page = 1;
    while (true) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) break;
        if (users.length === 0) break;
        allUsers = allUsers.concat(users);
        if (users.length < 1000) break;
        page++;
    }

    const authUser = allUsers.find(u => u.email === email);

    if (authUser) {
        console.log('✅ User found in Supabase Auth');
        console.log(`   ID: ${authUser.id}`);

        // Check profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (profile) {
            console.log('✅ Profile found:', profile);
        } else {
            console.warn('⚠️ No profile found. Creating one...');
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            const orgId = orgs?.[0]?.id;

            if (orgId) {
                await supabase.from('profiles').insert({
                    id: authUser.id,
                    email,
                    organization_id: orgId,
                    role: 'ADMIN',
                    name: 'Admin Barber 003'
                });
                console.log('✅ Profile created.');
            }
        }
    } else {
        console.error('❌ User still not found even with pagination.');
    }
}

verifySpecificUser();
