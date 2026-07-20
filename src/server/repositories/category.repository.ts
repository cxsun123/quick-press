import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';

export async function findAllCategories() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('categories').select('*')
    .order('sort_order', { ascending: true }).order('name');
  return data || [];
}

export async function findCategoriesWithCount() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, post_categories(count)')
    .order('name');
  return data || [];
}

export async function insertCategory(cat: { name: string; slug: string; parent_id: string | null }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('categories').insert(cat);
  if (error) throw error;
}

export async function removeCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
