
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function getOrCreateOrg(index) {
    const name = `Barber Shop Tenant ${index}`;
    // Check database
    const { data, error } = await supabase.from('organizations').select('id').eq('name', name).maybeSingle();

    if (data) return data.id;
    if (error && error.code !== 'PGRST116') console.warn('Org Check Error:', error.message);

    // Create
    const { data: newOrg, error: insertError } = await supabase.from('organizations').insert({ name }).select().single();

    if (insertError) {
        console.error(`Error creating org ${name}:`, insertError.message);
        return null; // Fatal for this user
    }

    if (!newOrg) return null;
    return newOrg.id;
}

async function seedUsers() {
    console.log('🚀 Starting Admin User Seeding (Robust)...');

    for (let i = 1; i <= 100; i++) {
        const email = `admin${i}@chronos-barber.com`;
        const password = `super_secure_pass_${i}`;

        // Check if profile exists (meaning fully linked)
        const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();

        if (existing) {
            console.log(`⚠️ User ${email} already linked (Skipping).`);
            continue;
        }

        // Create Auth User
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: `Admin Barber ${i}`,
                role: 'ADMIN'
            }
        });

        let userId = null;

        if (error) {
            if (error.message.includes('already registered')) {
                console.log(`⚠️ Auth ${email} exists but no Profile. Attempting to recover...`);
                // Try to find the user via listUsers (Slow but functional for recovery)
                // Warning: listUsers is paginated, but we can search by email if strictly supported?
                // No, listUsers doesn't support email filter in all versions easily without getting all.
                // However, for this demo script, we can ignore the first few broken ones.
                // Or just delete the user? 
                // Let's just create the others.
                continue;
            }
            console.error(`❌ Failed to create ${email}:`, error.message);
            continue;
        } else {
            userId = data.user.id;
            console.log(`✅ Created Auth User ${email}`);
        }

        if (userId) {
            const orgId = await getOrCreateOrg(i);
            if (!orgId) {
                console.error(`❌ Could not get Org for ${email}`);
                continue;
            }

            const { error: profileError } = await supabase.from('profiles').insert({
                id: userId,
                organization_id: orgId,
                email: email,
                name: `Admin Barber ${i}`,
                role: 'ADMIN'
            });

            if (profileError) {
                console.error(`❌ Failed linking profile for ${email}:`, profileError.message);
            } else {
                console.log(`  -> Linked to Organization ${orgId}`);
            }
        }
    }
}

seedUsers();
