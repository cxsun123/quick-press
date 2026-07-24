import fs from 'fs';

const raw = fs.readFileSync('/Users/chengxinsun/mycode/markdown_editor/quick-press/.env', 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const res = await fetch(`${url}/auth/v1/admin/users?per_page=50`, {
  headers: { Authorization: `Bearer ${key}`, apikey: key },
});
const text = await res.text();
let parsed = null;
try { parsed = JSON.parse(text); } catch {}
console.log('status:', res.status);
if (parsed && parsed.users) {
  const unverified = parsed.users.filter((u) => !u.email_confirmed_at);
  console.log(`total: ${parsed.users.length}, unverified: ${unverified.length}`);
  for (const u of parsed.users) {
    console.log(`- ${u.email}  confirmed=${!!u.email_confirmed_at}  id=${u.id}`);
  }
} else {
  console.log('body:', text.slice(0, 300));
}
