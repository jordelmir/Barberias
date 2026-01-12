import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env: any = {};
envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function getDatabaseUrl() {
    // Extract from VITE_SUPABASE_URL
    const url = new URL(env.VITE_SUPABASE_URL);
    const projectRef = url.hostname.split('.')[0];

    // Construct direct Postgres URL
    // Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
    console.log('Please provide the database password for direct connection.');
    console.log('You can find it in your Supabase project settings under Database > Connection string');
    console.log(`Project Reference: ${projectRef}`);

    return null;
}

async function addStickerColumnDirect() {
    console.log('--- Checking for sticker column ---');

    // Use Supabase client to check existing columns
    const { data: profileCols, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileCols && profileCols.length > 0) {
        const cols = Object.keys(profileCols[0]);
        console.log('Profiles columns:', cols);

        if (cols.includes('sticker')) {
            console.log('✅ Sticker column already exists in profiles');
        } else {
            console.log('❌ Sticker column missing from profiles');
            console.log('⚠️  Manual migration required via Supabase Dashboard SQL Editor:');
            console.log('');
            console.log('ALTER TABLE profiles ADD COLUMN sticker TEXT;');
            console.log('ALTER TABLE barbers ADD COLUMN sticker TEXT;');
            console.log('ALTER TABLE clients ADD COLUMN sticker TEXT;');
            console.log('');
        }
    }
}

addStickerColumnDirect();
