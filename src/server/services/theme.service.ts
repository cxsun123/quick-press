import 'server-only';
import { createClient } from '@/server/db/client';
import * as themeRepo from '@/server/repositories/theme.repository';

export async function uploadTheme(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const name = formData.get('name') as string;
  const file = formData.get('file') as File;
  if (!name || !file) throw new Error('请填写主题名称并选择 CSS 文件');
  if (!file.name.endsWith('.css')) throw new Error('只接受 .css 文件');

  const path = `user-themes/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('themes').upload(path, file, { contentType: 'text/css' });
  if (uploadError) throw new Error(uploadError.message);

  const { data: { publicUrl } } = supabase.storage.from('themes').getPublicUrl(path);

  await themeRepo.insertTheme({ name, storage_path: path, url: publicUrl, created_by: user.id });
}

export async function deleteTheme(themeId: string): Promise<void> {
  const supabase = await createClient();
  const theme = await themeRepo.findThemeById(themeId);
  if (!theme) return;
  await supabase.storage.from('themes').remove([theme.storage_path]);
  await themeRepo.removeTheme(themeId);
}

export async function activateTheme(themeId: string): Promise<void> {
  await themeRepo.deactivateAllThemes();
  await themeRepo.activateThemeById(themeId);
}

export async function deactivateTheme(): Promise<void> {
  await themeRepo.deactivateActiveThemes();
}

export async function listThemes() {
  return themeRepo.findAllThemes();
}

export async function getActiveTheme() {
  return themeRepo.findActiveTheme();
}
