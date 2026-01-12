import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- ENV LOADER ---
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

// --- CONFIGURATION ---
const BATCH_SIZE = 100;
const OUTPUT_FILE = path.join(process.cwd(), 'sales_credentials_v2.md');

// --- SECRETS (MUST BE PROVIDED) ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ FATAL: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    console.error('Please set these environment variables before running the script.');
    process.exit(1);
}

// Initialize Supabase with Service Role (Admin Access)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log(`🚀 Starting Sales Batch Generation (${BATCH_SIZE} Accounts)...`);

    let credentialsContent = `# 💰 Sales Credentials Batch (Generated ${new Date().toISOString()})\n\n`;
    credentialsContent += `| ID | Organization | Email | Password | Status |\n`;
    credentialsContent += `|--- |--- |--- |--- |--- |\n`;

    try {
        // --- PRE-FETCH ALL USERS (Optimization) ---
        console.log("🔍 Pre-fetching existing users for collision handling...");
        const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

        if (listError) console.error("   ⚠️ Failed to list users:", listError.message);

        const userMap = new Map((allUsers || []).map(u => [u.email?.toLowerCase(), u.id]));
        console.log(`   ✅ Found ${userMap.size} existing users in Supabase Auth.`);

        // --- 0. PROVISION GERENTE GENERAL (MASTER ADMIN) ---
        console.log(`👑 Provisioning GERENTE GENERAL...`);
        const managerEmail = 'admin@chronos.barber';
        const managerPassword = '000000'; // As requested
        const managerId = '000000000'; // Used as identification

        const { data: managerOrg } = await supabase.from('organizations').insert({ name: 'Chronos Barberia (Sede Central)' }).select().single();

        if (managerOrg) {
            let mgrUserId: string | null = null;
            const { data: managerAuth, error: managerAuthErr } = await supabase.auth.admin.createUser({
                email: managerEmail,
                password: managerPassword,
                email_confirm: true,
                user_metadata: { name: 'Gerente General' }
            });

            if (managerAuth?.user) {
                mgrUserId = managerAuth.user.id;
            } else if (managerAuthErr?.message?.includes("already registered") || managerAuthErr?.status === 422 || managerAuthErr?.status === 400) {
                // Fetch existing from Map
                mgrUserId = userMap.get(managerEmail.toLowerCase()) || null;
                if (mgrUserId) {
                    console.log("   🔸 Manager exists, ID retrieved from map.");
                    await supabase.auth.admin.updateUserById(mgrUserId, { password: managerPassword });
                } else {
                    console.error(`   ❌ Manager exists but not found in pre-fetch list!`);
                }
            } else {
                console.log("   ⚠️ Manager auth error:", managerAuthErr?.message);
            }

            if (mgrUserId) {
                // Upsert Profile
                await supabase.from('profiles').upsert({
                    id: mgrUserId,
                    organization_id: managerOrg.id,
                    email: managerEmail,
                    role: 'ADMIN',
                    name: 'Gerente General',
                    created_at: new Date().toISOString()
                });

                // Barber entry
                await supabase.from('barbers').insert({
                    organization_id: managerOrg.id,
                    profile_id: mgrUserId,
                    name: 'Gerente General',
                    email: managerEmail,
                    identification: managerId,
                    access_code: '000000',
                    tier: 'MASTER',
                    is_admin: true
                });

                credentialsContent += `| MASTER | **Chronos Central** | **${managerEmail}** | \`${managerPassword}\` | 👑 MANAGER |\n`;
            }
        }


        // --- SALES BATCH ---
        for (let i = 1; i <= BATCH_SIZE; i++) {
            const orgName = `Barberia Premium #${i.toString().padStart(3, '0')}`;
            const email = `admin.barber.${i.toString().padStart(3, '0')}@chronos.app`;
            const password = `Chronos.${Math.random().toString(36).slice(-8).toUpperCase()}!`;

            console.log(`[${i}/${BATCH_SIZE}] Provisioning ${orgName}...`);

            // 1. Create Organization
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({ name: orgName })
                .select()
                .single();

            if (orgError) {
                console.error(`   ❌ Failed to create Org ${i}:`, orgError.message);
                continue;
            }

            // 2. Create or Get Auth User
            let userId: string | null = null;

            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: `Admin Estándar` }
            });

            if (authError) {
                // Check collision using map
                if (authError.message.includes("already registered") || authError.status === 400 || authError.status === 422) {
                    userId = userMap.get(email.toLowerCase()) || null;

                    if (userId) {
                        // Optional: Update password here
                        await supabase.auth.admin.updateUserById(userId, { password: password });
                    } else {
                        console.error(`   ❌ Failed to find ID for existing user ${email} in map.`);
                        continue;
                    }
                } else {
                    console.error(`   ❌ Failed to create Auth User ${i}:`, authError.message);
                    continue;
                }
            } else {
                userId = authData.user.id;
            }

            if (!userId) continue;

            // 3. Create Admin Profile (Upsert)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    organization_id: orgData.id,
                    email,
                    role: 'ADMIN',
                    name: 'Administrador Principal',
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                console.error(`   ❌ Failed to link Profile ${i}:`, profileError.message);
                continue;
            }

            // 4. Initialize Default Services
            await supabase.from('services').insert([
                { organization_id: orgData.id, name: 'Corte Clásico', duration_minutes: 30, price: 15000 },
                { organization_id: orgData.id, name: 'Barba & Toalla', duration_minutes: 20, price: 10000 },
                { organization_id: orgData.id, name: 'Experiencia Completa', duration_minutes: 60, price: 25000 },
            ]);

            // 5. Initialize One Barber
            await supabase.from('barbers').insert([
                {
                    organization_id: orgData.id,
                    profile_id: userId, // Link admin to barber entry
                    name: 'Administrador Principal',
                    email: email,
                    tier: 'MASTER',
                    is_admin: true
                }
            ]);

            // Success Log
            credentialsContent += `| ${i} | ${orgName} | **${email}** | \`${password}\` | ✅ Ready |\n`;
        }

        // Save File
        fs.writeFileSync(OUTPUT_FILE, credentialsContent);
        console.log(`\n✨ SUCCESS! Credentials saved to: ${OUTPUT_FILE}`);
        console.log(`   Use these credentials to start selling immediately.`);

    } catch (err) {
        console.error('CRITICAL UNEXPECTED ERROR:', err);
    }
}

main();
