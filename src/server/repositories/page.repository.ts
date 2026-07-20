import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';

export async function findAllPages() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('pages').select('*')
    .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  return data || [];
}

export async function findBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('pages').select('*').eq('slug', slug).single();
  return data;
}

export async function findPageById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('pages').select('*').eq('id', id).single();
  return data;
}

export async function insertPage(page: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('pages').insert(page);
  if (error) throw new Error(error.message);
}

export async function updatePage(id: string, updates: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('pages').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removePage(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('pages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
