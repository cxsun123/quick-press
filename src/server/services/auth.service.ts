import 'server-only';
import { createClient, createAdminClient } from '@/server/db/client';
import * as userRepo from '@/server/repositories/user.repository';

export async function login(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message === 'Invalid login credentials'
      ? '邮箱或密码错误'
      : error.message === 'Email not confirmed'
        ? '邮箱未验证'
        : error.message;
    return { error: msg };
  }
  return {};
}

export async function register(email: string, password: string, name?: string) {
  if (!email || !password) return { error: '请填写邮箱和密码' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const msg = error.message === 'User already registered'
      ? '该邮箱已注册'
      : error.message === 'Password should be at least 6 characters'
        ? '密码至少 6 位'
        : error.message === 'Unable to validate email address: invalid format'
          ? '邮箱格式不正确'
          : error.message;
    return { error: msg };
  }
  if (!data.user) return { error: '注册失败，请重试' };

  const adminSupabase = createAdminClient();
  const { count } = await adminSupabase.from('user_profiles').select('user_id', { count: 'exact', head: true });
  const isFirstUser = !count || count === 0;
  const { error: profileError } = await adminSupabase.from('user_profiles').insert({
    user_id: data.user.id,
    display_name: name || email.split('@')[0],
    role: isFirstUser ? 'admin' : 'subscriber',
  });
  if (profileError) return { error: '创建用户资料失败' };

  return {};
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await userRepo.findUserById(user.id);
  return { id: user.id, email: user.email, ...profile };
}
