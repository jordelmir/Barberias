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

async function search() {
    console.log('--- Global Search for "[blocked]" ---');

    // List of public tables to check
    const tables = ['profiles', 'organizations', 'barbers', 'services', 'clients', 'appointments'];

    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error reading ${table}:`, error.message);
            continue;
        }

        if (data) {
            data.forEach((row: any) => {
                const rowStr = JSON.stringify(row);
                if (rowStr.toLowerCase().includes('blocked')) {
                    console.log(`MATCH FOUND in ${table}:`, row);
                }
            });
        }
    }
    console.log('--- Search Finished ---');
}

search();
