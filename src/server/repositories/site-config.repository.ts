import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';

export async function findConfig(key: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', key).single();
  return data?.value || null;
}

export async function findThemeConfig() {
  const supabase = await createClient();
  const { data } = await supabase.from('site_config').select('key, value').in('key', ['theme_mode', 'blog_theme']);
  const map = Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
  return map;
}

export async function upsertConfig(key: string, value: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('site_config').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

export async function upsertConfigs(items: { key: string; value: string }[]) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('site_config').upsert(items, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

export async function findAllConfigs(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from('site_config').select('key, value');
  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.key] = row.value;
  }
  return map;
}
