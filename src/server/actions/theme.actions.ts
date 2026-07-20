'use server';

import { revalidatePath } from 'next/cache';
import * as themeService from '@/server/services/theme.service';

export async function uploadTheme(formData: FormData): Promise<void> {
  await themeService.uploadTheme(formData);
  revalidatePath('/admin/themes');
}

export async function deleteTheme(themeId: string): Promise<void> {
  await themeService.deleteTheme(themeId);
  revalidatePath('/admin/themes');
}

export async function activateTheme(themeId: string): Promise<void> {
  await themeService.activateTheme(themeId);
  revalidatePath('/');
}

export async function deactivateTheme(): Promise<void> {
  await themeService.deactivateTheme();
  revalidatePath('/');
}

export async function listThemes() {
  return themeService.listThemes();
}

export async function getActiveTheme() {
  return themeService.getActiveTheme();
}
