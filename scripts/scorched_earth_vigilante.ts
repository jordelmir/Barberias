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

async function superScrub() {
    console.log('--- Super Scrub: Role and Name Consistency ---');

    // 1. Fetch all profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    console.log(`Processing ${profiles.length} profiles...`);

    for (const p of profiles) {
        // Condition: identification is a number 0-100 or name contains specific tags
        const idNum = parseInt(p.identification || '');
        const isShopAccount = (idNum >= 0 && idNum <= 100) || p.name.includes('Barber Shop') || p.name.includes('Administrador');

        if (isShopAccount) {
            // a. Determine clean name
            let cleanName = p.name;
            if (idNum === 0) {
                cleanName = 'Super Admin';
            } else if (p.name.includes('Barber Shop')) {
                // Extract "Barber Shop XXX"
                const match = p.name.match(/Barber Shop \d+/i);
                if (match) cleanName = match[0];
                else {
                    // Fallback using identification if possible
                    cleanName = `Barber Shop ${p.identification.padStart(3, '0')}`;
                }
            }

            console.log(`Cleaning ID ${p.identification} | ${p.name} -> ${cleanName} (Role: ADMIN)`);

            // b. Update Profile
            const { error: upError } = await supabase
                .from('profiles')
                .update({
                    role: 'ADMIN',
                    name: cleanName
                })
                .eq('id', p.id);

            if (upError) console.error(`Error updating profile ${p.identification}:`, upError.message);

            // c. Handle Barbers table (Remove duplicates and sync)
            const { data: barbers, error: bError } = await supabase
                .from('barbers')
                .select('id')
                .eq('profile_id', p.id);

            if (bError) {
                console.error(`Error fetching barbers for ${p.id}:`, bError.message);
                continue;
            }

            if (barbers && barbers.length > 0) {
                // Update the first one
                const mainBarberId = barbers[0].id;
                await supabase
                    .from('barbers')
                    .update({
                        name: cleanName,
                        is_admin: true,
                        identification: p.identification
                    })
                    .eq('id', mainBarberId);

                // Delete the rest (duplicates)
                if (barbers.length > 1) {
                    const idsToDelete = barbers.slice(1).map(b => b.id);
                    console.log(`Deleting ${idsToDelete.length} duplicates for ID ${p.identification}`);
                    await supabase.from('barbers').delete().in('id', idsToDelete);
                }
            }
        }
    }

    console.log('✅ Super Scrub Completed.');
}

superScrub();
