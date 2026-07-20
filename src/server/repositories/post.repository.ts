import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';
import type { PostFilter, PaginatedPosts } from '@/models/post.model';

export async function findPublishedPostsPaginated(
  page: number,
  perPage: number,
  filter: PostFilter,
): Promise<{ posts: any[]; total: number; totalPages: number; currentPage: number }> {
  const supabase = await createClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let countQuery = supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  let dataQuery = supabase
    .from('posts')
    .select(
      `id, title, slug, excerpt, cover_image_url, published_at, is_pinned,
       post_categories(categories(id, name, slug)),
       post_tags(tags(id, name, slug, color))`,
    )
    .eq('status', 'published');

  if (filter.month) {
    const start = `${filter.month}-01T00:00:00.000Z`;
    const [year, mon] = filter.month.split('-').map(Number);
    const endMonth = mon === 12 ? 1 : mon + 1;
    const endYear = mon === 12 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`;
    countQuery = countQuery.gte('published_at', start).lt('published_at', end);
    dataQuery = dataQuery.gte('published_at', start).lt('published_at', end);
  }

  if (filter.query) {
    const q = `%${filter.query}%`;
    countQuery = countQuery.or(`title.ilike.${q},excerpt.ilike.${q}`);
    dataQuery = dataQuery.or(`title.ilike.${q},excerpt.ilike.${q}`);
  }

  return { posts: [], total: 0, totalPages: 0, currentPage: page };
}

export async function findAllByAuthor(authorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('posts')
    .select(`id, title, slug, status, visibility, published_at, created_at, share_token,
      post_tags(tags(id, name, slug, color))`)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function findPublished(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at, is_pinned')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });
  return data || [];
}

export async function findRecentPosts(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function findMonthlyArchives() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });
  return data || [];
}

export async function findById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('posts').select('*, post_tags(tag_id), post_categories(category_id)').eq('id', id).single();
  return data;
}

export async function findTagsByPost(postId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('post_tags').select('tags(*)').eq('post_id', postId);
  return data?.map((r: any) => r.tags).filter(Boolean) || [];
}

export async function findCategoriesByPost(postId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('post_categories').select('categories(*)').eq('post_id', postId);
  return data?.map((r: any) => r.categories).filter(Boolean) || [];
}

export async function insertPost(post: any) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('posts').insert(post).select('id').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePost(id: string, updates: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('posts').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removePost(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updatePostsVisibility(ids: string[], visibility: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('posts')
    .update({ visibility })
    .in('id', ids);
  if (error) throw new Error(error.message);
}

export async function findByShareToken(token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('share_token', token)
    .single();
  return data;
}

export async function regenerateShareToken(postId: string): Promise<string> {
  const supabase = createAdminClient();
  const newToken = crypto.randomUUID();
  const { error } = await supabase
    .from('posts')
    .update({ share_token: newToken })
    .eq('id', postId);
  if (error) throw new Error(error.message);
  return newToken;
}

export async function findByIdAdmin(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, visibility, password_hash, share_token')
    .eq('id', id)
    .single();
  return data;
}

export async function clearPostTags(postId: string) {
  const admin = createAdminClient();
  await admin.from('post_tags').delete().eq('post_id', postId);
}

export async function insertPostTags(tags: { post_id: string; tag_id: string }[]) {
  const admin = createAdminClient();
  const { error } = await admin.from('post_tags').insert(tags);
  if (error) throw new Error('保存标签失败: ' + error.message);
}

export async function clearPostCategories(postId: string) {
  const admin = createAdminClient();
  await admin.from('post_categories').delete().eq('post_id', postId);
}

export async function insertPostCategories(categories: { post_id: string; category_id: string }[]) {
  const admin = createAdminClient();
  const { error } = await admin.from('post_categories').insert(categories);
  if (error) throw new Error('保存分类失败: ' + error.message);
}
