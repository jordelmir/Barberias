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

async function patchRoles() {
    console.log('--- Patching Roles for Shop Managers ---');

    // Find all users with names starting with "Administrador" or similar
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, name, role')
        .neq('id', '000000000'); // Skip Super Admin if it's there (though usually auth ID)

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        return;
    }

    let count = 0;
    for (const p of profiles || []) {
        if (p.name.includes('Administrador') || p.name.includes('Barber Shop')) {
            // Remove "Administrador " prefix if exists
            const cleanName = p.name.replace(/^Administrador\s+/i, '');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'ADMIN', name: cleanName })
                .eq('id', p.id);

            if (updateError) {
                console.error(`Error updating ${p.name}:`, updateError.message);
            } else {
                // Also update barbers table
                await supabase.from('barbers').update({ name: cleanName, is_admin: true }).eq('profile_id', p.id);
                count++;
            }
        }
    }

    console.log(`✅ Patched ${count} profiles to ADMIN role.`);
}

patchRoles();
