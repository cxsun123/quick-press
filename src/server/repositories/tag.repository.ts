import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';

export async function findAllTags() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('tags').select('*').order('name');
  return data || [];
}

export async function findTagsWithCount() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('tags')
    .select('id, name, slug, color, post_tags(count)')
    .order('name');
  return data || [];
}

export async function insertTag(tag: { name: string; slug: string; color: string }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('tags').insert(tag);
  if (error) throw error;
}

export async function findTagByName(name: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('tags').select('id, name, slug, color').eq('name', name).single();
  return data;
}

export async function removeTag(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
