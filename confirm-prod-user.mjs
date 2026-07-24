import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

// Parse .env.production (minimal KEY=VALUE parser, no secret printing)
const raw = fs.readFileSync('/Users/chengxinsun/mycode/markdown_editor/quick-press/.env.production', 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await admin.auth.admin.listUsers();
if (error) {
  console.error('listUsers error:', error.message);
  process.exit(1);
}

const unverified = data.users.filter((u) => !u.email_confirmed_at);
console.log(`DB: ${url}`);
console.log(`Total users: ${data.users.length}, unverified: ${unverified.length}`);
if (unverified.length === 0) {
  console.log('Nothing to confirm.');
  process.exit(0);
}

for (const u of unverified) {
  const { error: updErr } = await admin.auth.admin.updateUserById(u.id, {
    email_confirmed_at: new Date().toISOString(),
  });
  if (updErr) {
    console.error(`FAILED to confirm ${u.email}: ${updErr.message}`);
  } else {
    console.log(`CONFIRMED: ${u.email} (role in app handled separately)`);
  }
}
console.log('Done.');
