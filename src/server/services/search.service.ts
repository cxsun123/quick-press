import 'server-only';
import { createClient } from '@/server/db/client';

export async function searchPosts(query: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(20);
  return (data || []).map((post: any) => ({
    ...post, excerpt: post.excerpt || post.title,
  }));
}

export async function searchAll(query: string) {
  const supabase = await createClient();
  const [posts, pages, tags] = await Promise.all([
    supabase.from('posts').select('id, title, slug, published_at')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false }).limit(10),
    supabase.from('pages').select('id, title, slug')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`).limit(10),
    supabase.from('tags').select('id, name, slug')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%`).limit(10),
  ]);
  return {
    posts: posts.data || [],
    pages: pages.data || [],
    tags: tags.data || [],
  };
}
