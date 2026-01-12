import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting Tables ---');

    const tables = ['profiles', 'barbers', 'clients'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table ${table}: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`✅ Table ${table} columns:`, Object.keys(data[0]));
        } else {
            console.log(`⚠️ Table ${table}: Empty (can't see columns easily)`);
        }
    }
}

inspect();
