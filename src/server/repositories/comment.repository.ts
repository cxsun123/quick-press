import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';

export async function insertComment(comment: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('comments').insert(comment);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateCommentStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('comments').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeComment(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function findApprovedByPost(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('comments').select('*')
    .eq('post_id', postId).eq('status', 'approved')
    .order('created_at', { ascending: true });
  return data || [];
}

export async function findAllComments(status?: string) {
  const supabase = createAdminClient();
  let query = supabase.from('comments').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return data || [];
}
