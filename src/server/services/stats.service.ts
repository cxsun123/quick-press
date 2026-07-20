import 'server-only';
import { createClient } from '@/server/db/client';

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [postCount, publishedCount, commentCount, pendingCommentCount] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'published'),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  return {
    totalPosts: postCount.count || 0,
    publishedPosts: publishedCount.count || 0,
    totalComments: commentCount.count || 0,
    pendingComments: pendingCommentCount.count || 0,
  };
}
