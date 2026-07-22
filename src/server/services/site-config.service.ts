import 'server-only';
import * as configRepo from '@/server/repositories/site-config.repository';

export async function getSiteConfig(key: string) {
  return configRepo.findConfig(key);
}

export async function getRegistrationMode(): Promise<'open' | 'invite' | 'closed'> {
  const mode = await configRepo.findConfig('registration_mode');
  if (mode === 'invite' || mode === 'closed') return mode;
  return 'open';
}

export async function updateSiteConfig(key: string, value: string) {
  await configRepo.upsertConfig(key, value);
}

export async function getSiteTheme(): Promise<{ mode: string; theme: string }> {
  const map = await configRepo.findThemeConfig();
  return {
    mode: map.theme_mode || 'light',
    theme: map.blog_theme || 'default',
  };
}

export async function saveSiteTheme(mode: string, theme: string) {
  await configRepo.upsertConfig('theme_mode', mode);
  await configRepo.upsertConfig('blog_theme', theme);
}

export async function getFontFamily(): Promise<string> {
  return (await configRepo.findConfig('font_family')) || '';
}

export async function getBgImage(): Promise<{ url: string; opacity: number }> {
  const [url, opacity] = await Promise.all([
    configRepo.findConfig('bg_image_url'),
    configRepo.findConfig('bg_image_opacity'),
  ]);
  return { url: url || '', opacity: opacity ? parseInt(opacity) : 100 };
}
