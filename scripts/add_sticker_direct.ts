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

async function addStickerColumn() {
    console.log('--- Adding sticker column to profiles, barbers, and clients ---');

    const migrations = [
        `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sticker TEXT;`,
        `ALTER TABLE barbers ADD COLUMN IF NOT EXISTS sticker TEXT;`,
        `ALTER TABLE clients ADD COLUMN IF NOT EXISTS sticker TEXT;`
    ];

    for (const sql of migrations) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.error(`❌ Error executing: ${sql}`);
            console.error(error);
        } else {
            console.log(`✅ Executed: ${sql}`);
        }
    }
}

addStickerColumn();
