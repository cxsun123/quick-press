import 'server-only';
import * as configRepo from '@/server/repositories/site-config.repository';
import { encrypt, decrypt, hasEncryptionKey } from '@/server/utils/encryption';

const SENSITIVE_KEYS = ['ai_api_key', 'mcp_api_key'];

function encryptValue(key: string, value: string): string {
  return SENSITIVE_KEYS.includes(key) ? encrypt(value) : value;
}

function decryptValue(key: string, value: string): string {
  return SENSITIVE_KEYS.includes(key) ? decrypt(value) : value;
}

export function isEncryptionReady(): boolean {
  return hasEncryptionKey();
}

export async function getSiteConfig(key: string) {
  const value = await configRepo.findConfig(key);
  return value ? decryptValue(key, value) : value;
}

export async function getRegistrationMode(): Promise<'open' | 'invite' | 'closed'> {
  const mode = await configRepo.findConfig('registration_mode');
  if (mode === 'invite' || mode === 'closed') return mode;
  return 'open';
}

export async function updateSiteConfig(key: string, value: string) {
  if (SENSITIVE_KEYS.includes(key) && !hasEncryptionKey()) return;
  await configRepo.upsertConfig(key, encryptValue(key, value));
}

export async function updateSiteConfigs(data: Record<string, string>): Promise<{ skipped: string[] }> {
  const skipped: string[] = [];
  const items: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.includes(key) && !hasEncryptionKey()) {
      skipped.push(key);
      continue;
    }
    items.push({ key, value: encryptValue(key, value) });
  }
  if (items.length > 0) await configRepo.upsertConfigs(items);
  return { skipped };
}

export async function getAllSiteConfigs(): Promise<Record<string, string>> {
  const raw = await configRepo.findAllConfigs();
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = decryptValue(key, value);
  }
  if (!hasEncryptionKey()) {
    for (const key of SENSITIVE_KEYS) {
      result[key] = '';
    }
  }
  return result;
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
