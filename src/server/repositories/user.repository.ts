import 'server-only';
import { createAdminClient } from '@/server/db/client';

export async function findAllUsers() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url, role, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  return data || [];
}

export async function findUserById(userId: string) {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
  return profile;
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('user_profiles').update({ role }).eq('user_id', userId);
  if (error) throw new Error(error.message);
}
