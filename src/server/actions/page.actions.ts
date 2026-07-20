'use server';

import { revalidatePath } from 'next/cache';
import * as pageService from '@/server/services/page.service';

export async function createPage(formData: FormData): Promise<{ error?: string }> {
  const result = await pageService.createPage(formData);
  revalidatePath('/admin/pages');
  return result;
}

export async function updatePage(pageId: string, formData: FormData): Promise<{ error?: string }> {
  const result = await pageService.updatePage(pageId, formData);
  revalidatePath('/admin/pages');
  return result;
}

export async function deletePage(pageId: string): Promise<{ error?: string }> {
  const result = await pageService.deletePage(pageId);
  revalidatePath('/admin/pages');
  return result;
}

export async function getPages() {
  return pageService.getPages();
}

export async function getPage(slug: string) {
  return pageService.getPage(slug);
}

export async function getPageById(id: string) {
  return pageService.getPageById(id);
}
