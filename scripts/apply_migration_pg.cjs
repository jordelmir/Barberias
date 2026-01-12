const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because we don't want to depend on too many things
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

console.log('Environment keys found:', Object.keys(env));
if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL missing in .env.local');
    process.exit(1);
}

async function run() {
    const client = new Client({
        connectionString: env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260112_fix_barber_identification.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Applying migration...');
        await client.query(sql);
        console.log('✅ Migration applied successfully!');

    } catch (err) {
        console.error('❌ Error details:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
