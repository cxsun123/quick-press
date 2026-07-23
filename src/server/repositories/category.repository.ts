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
    .select('*, post_categories(count)')
    .order('sort_order', { ascending: true })
    .order('name');
  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parent_id: c.parent_id,
    sort_order: c.sort_order,
    created_at: c.created_at,
    updated_at: c.updated_at,
    count: c.post_categories?.[0]?.count ?? 0,
  }));
}

export async function insertCategory(cat: { name: string; slug: string; parent_id: string | null }) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('categories').insert(cat);
  if (error) throw error;
}

export async function findCategoryByName(name: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('categories').select('id, name, slug').eq('name', name).single();
  return data;
}

export async function removeCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
