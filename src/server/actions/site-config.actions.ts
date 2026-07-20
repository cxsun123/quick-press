'use server';

import { revalidatePath } from 'next/cache';
import * as siteConfigService from '@/server/services/site-config.service';

export async function getSiteConfig(key: string) {
  return siteConfigService.getSiteConfig(key);
}

export async function getRegistrationMode(): Promise<'open' | 'invite' | 'closed'> {
  return siteConfigService.getRegistrationMode();
}

export async function updateSiteConfig(key: string, value: string) {
  await siteConfigService.updateSiteConfig(key, value);
}

export async function getSiteTheme(): Promise<{ mode: string; theme: string }> {
  return siteConfigService.getSiteTheme();
}

export async function saveSiteTheme(mode: string, theme: string) {
  await siteConfigService.saveSiteTheme(mode, theme);
  revalidatePath('/', 'layout');
}
