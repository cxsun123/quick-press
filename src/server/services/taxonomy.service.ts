import 'server-only';
import { slugify } from '@/server/utils/slug';
import * as tagRepo from '@/server/repositories/tag.repository';
import * as categoryRepo from '@/server/repositories/category.repository';

export async function createTag(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get('name') as string || '').trim();
  if (!name) return { error: '标签名不能为空' };
  const slug = formData.get('slug') as string || slugify(name);
  const color = formData.get('color') as string || '#3B82F6';
  try {
    await tagRepo.insertTag({ name, slug, color });
  } catch (e: any) {
    if (e?.code === '23505') return { error: `标签「${name}」已存在` };
    return { error: e.message };
  }
  return {};
}

export async function deleteTag(tagId: string): Promise<{ error?: string }> {
  await tagRepo.removeTag(tagId);
  return {};
}

export async function getTags() {
  return tagRepo.findAllTags();
}

export async function getTagsWithCount() {
  const data = await tagRepo.findTagsWithCount();
  return (data || []).map((t: any) => ({
    id: t.id, name: t.name, slug: t.slug,
    color: t.color || '#3B82F6',
    count: t.post_tags?.[0]?.count ?? 0,
  }));
}

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get('name') as string || '').trim();
  if (!name) return { error: '分类名不能为空' };
  const slug = formData.get('slug') as string || slugify(name);
  const parentId = formData.get('parent_id') as string || null;
  try {
    await categoryRepo.insertCategory({ name, slug, parent_id: parentId });
  } catch (e: any) {
    if (e?.code === '23505') return { error: `分类「${name}」已存在` };
    return { error: e.message };
  }
  return {};
}

export async function deleteCategory(catId: string): Promise<{ error?: string }> {
  await categoryRepo.removeCategory(catId);
  return {};
}

export async function getCategories() {
  return categoryRepo.findAllCategories();
}

export async function getCategoriesWithCount() {
  const data = await categoryRepo.findCategoriesWithCount();
  return (data || []).map((c: any) => ({
    id: c.id, name: c.name, slug: c.slug,
    count: c.post_categories?.[0]?.count ?? 0,
  }));
}
