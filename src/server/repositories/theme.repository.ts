import 'server-only';
import { createAdminClient } from '@/server/db/client';

export async function findAllThemes() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('themes').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function findActiveTheme() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('themes').select('url').eq('is_active', true).single();
  return data?.url || null;
}

export async function findThemeById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('themes').select('storage_path').eq('id', id).single();
  return data;
}

export async function insertTheme(theme: { name: string; storage_path: string; url: string; created_by: string }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('themes').insert(theme);
  if (error) throw new Error(error.message);
}

export async function removeTheme(id: string) {
  const supabase = createAdminClient();
  await supabase.from('themes').delete().eq('id', id);
}

export async function deactivateAllThemes() {
  const supabase = createAdminClient();
  await supabase.from('themes').update({ is_active: false }).neq('id', '');
}

export async function activateThemeById(id: string) {
  const supabase = createAdminClient();
  await supabase.from('themes').update({ is_active: true }).eq('id', id);
}

export async function deactivateActiveThemes() {
  const supabase = createAdminClient();
  await supabase.from('themes').update({ is_active: false }).eq('is_active', true);
}
