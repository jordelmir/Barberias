
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs';

// Requires SERVICE_ROLE_KEY to create users
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required to seed auth users.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedUsers() {
  console.log('🚀 Starting Admin User Seeding...');
  const users = [];

  for (let i = 1; i <= 100; i++) {
    const email = `admin${i}@chronos-barber.com`;
    const password = `super_secure_pass_${i}`;
    
    // Check if user exists first to avoid errors
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
    
    if (existing) {
      console.log(`⚠️ User ${email} already linked.`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: `Admin Barber ${i}`,
        role: 'ADMIN'
      }
    });

    if (error) {
      console.error(`❌ Failed to create ${email}:`, error.message);
    } else {
      console.log(`✅ Created ${email}`);
      users.push({ email, password, id: data.user.id });
    }
  }

  // Generate Report
  const content = `# 🔐 Production Access Credentials
  
| Tenant ID | Email (Username) | Password | Role |
| :--- | :--- | :--- | :--- |
${users.map((u, idx) => `| ${idx + 1} | \`${u.email}\` | \`${u.password}\` | **ADMIN** |`).join('\n')}

> [!WARNING]
> These are default generated credentials. Please instruct your clients to change their password upon first login.
`;

  fs.writeFileSync('CREDENTIALS.md', content);
  console.log('📄 CREDENTIALS.md generated successfully.');
}

seedUsers();
