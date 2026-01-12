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
        for (let i = 1; i <= BATCH_SIZE; i++) {
            const orgName = `Barberia Premium #${i.toString().padStart(3, '0')}`;
            const email = `admin.barber.${i.toString().padStart(3, '0')}@chronos.app`;
            const password = `Chronos.${Math.random().toString(36).slice(-8).toUpperCase()}!`;

            console.log(`[${i}/${BATCH_SIZE}] Provisioning ${orgName}...`);

            // 1. Create Organization (Using RPC or Insert if policies allow, but Service Key bypasses RLS)
            // Note: We insert directly since we have Service Key.
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({ name: orgName })
                .select()
                .single();

            if (orgError) {
                console.error(`   ❌ Failed to create Org ${i}:`, orgError.message);
                continue;
            }

            // 2. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: `Admin Estándar` }
            });

            if (authError) {
                console.error(`   ❌ Failed to create Auth User ${i}:`, authError.message);
                // Rollback Org? (In a real script yes, here we skip)
                continue;
            }

            const userId = authData.user.id;

            // 3. Create Admin Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    organization_id: orgData.id, // THE CRITICAL LINK
                    email,
                    role: 'ADMIN',
                    name: 'Administrador Principal',
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                console.error(`   ❌ Failed to link Profile ${i}:`, profileError.message);
                continue;
            }

            // 4. Initialize Default Services (So app works out of box)
            await supabase.from('services').insert([
                { organization_id: orgData.id, name: 'Corte Clásico', duration_minutes: 30, price: 15000 },
                { organization_id: orgData.id, name: 'Barba & Toalla', duration_minutes: 20, price: 10000 },
                { organization_id: orgData.id, name: 'Experiencia Completa', duration_minutes: 60, price: 25000 },
            ]);

            // 5. Initialize One Barber (So dashboard works)
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
