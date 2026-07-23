'use server';

import { revalidatePath } from 'next/cache';
import * as taxonomyService from '@/server/services/taxonomy.service';

export async function createTag(formData: FormData): Promise<{ error?: string; id?: string }> {
  const result = await taxonomyService.createTag(formData);
  revalidatePath('/admin/tags');
  return result;
}

export async function deleteTag(tagId: string): Promise<{ error?: string }> {
  const result = await taxonomyService.deleteTag(tagId);
  revalidatePath('/admin/tags');
  return result;
}

export async function getTags() {
  return taxonomyService.getTags();
}

export async function createCategory(formData: FormData): Promise<{ error?: string; id?: string }> {
  const result = await taxonomyService.createCategory(formData);
  revalidatePath('/admin/tags');
  return result;
}

export async function deleteCategory(catId: string): Promise<{ error?: string }> {
  const result = await taxonomyService.deleteCategory(catId);
  revalidatePath('/admin/tags');
  return result;
}

export async function getCategories() {
  return taxonomyService.getCategories();
}

export async function getCategoriesWithCount() {
  return taxonomyService.getCategoriesWithCount();
}

export async function getCategoriesTree() {
  return taxonomyService.getCategoriesTree();
}

export async function getTagsWithCount() {
  return taxonomyService.getTagsWithCount();
}
