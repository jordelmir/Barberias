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

async function createUserWithCredentials() {
    console.log('--- Creating User with Provided Credentials ---');

    const email = 'jordelmir1@gmail.com';
    const password = '937383'; // This will be the access code
    const identification = '73812570';
    const phone = '116220243';

    // 1. Check if user already exists
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (existingProfile) {
        console.log('✅ User already exists in profiles:', existingProfile);

        // Check if they exist in auth
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const authUser = users.find(u => u.email === email);

        if (authUser) {
            console.log('✅ User exists in auth.users');
            console.log('Attempting to update password...');

            const { error: updateError } = await supabase.auth.admin.updateUserById(
                authUser.id,
                { password }
            );

            if (updateError) {
                console.error('❌ Error updating password:', updateError);
            } else {
                console.log('✅ Password updated successfully');
            }
        } else {
            console.log('❌ User exists in profiles but NOT in auth.users');
            console.log('This is a data inconsistency issue.');
        }

        return;
    }

    // 2. Get the organization (use first available or create one)
    let { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
    let orgId: string;

    if (!orgs || orgs.length === 0) {
        const { data: newOrg } = await supabase
            .from('organizations')
            .insert({ name: 'Barberia Principal' })
            .select()
            .single();
        orgId = newOrg!.id;
        console.log('✅ Created new organization:', orgId);
    } else {
        orgId = orgs[0].id;
        console.log('✅ Using existing organization:', orgs[0].name, orgId);
    }

    // 3. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name: 'Jordelmir',
            identification
        }
    });

    if (authError) {
        console.error('❌ Error creating auth user:', authError);
        return;
    }

    console.log('✅ Created auth user:', authData.user.id);

    // 4. Create profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: authData.user.id,
            email,
            organization_id: orgId,
            role: 'CLIENT',
            name: 'Jordelmir',
            phone,
            identification,
            is_blocked: false
        });

    if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        return;
    }

    console.log('✅ Created profile');

    // 5. Create client record
    const { error: clientError } = await supabase
        .from('clients')
        .insert({
            organization_id: orgId,
            name: 'Jordelmir',
            email,
            phone,
            access_code: password,
            points: 0
        });

    if (clientError) {
        console.error('❌ Error creating client:', clientError);
        return;
    }

    console.log('✅ Created client record');
    console.log('');
    console.log('🎉 User created successfully!');
    console.log('Login credentials:');
    console.log(`  Email/ID: ${email} or ${identification}`);
    console.log(`  Password: ${password}`);
}

createUserWithCredentials();
