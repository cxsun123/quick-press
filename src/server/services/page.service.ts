import 'server-only';
import { slugify, ensureUniqueSlug } from '@/server/utils/slug';
import { createClient } from '@/server/db/client';
import * as pageRepo from '@/server/repositories/page.repository';

export async function createPage(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '未登录' };

  const title = formData.get('title') as string;
  const content = (formData.get('content') as string) || '';
  const rawSlug = formData.get('slug') as string || slugify(title);
  const slug = await ensureUniqueSlug(await createClient(), 'pages', rawSlug);
  const parentId = formData.get('parent_id') as string || null;
  const template = formData.get('template') as string || 'default';

  await pageRepo.insertPage({
    author_id: user.id, title, slug, content,
    parent_id: parentId, template, status: 'published',
  });
  return {};
}

export async function updatePage(pageId: string, formData: FormData): Promise<{ error?: string }> {
  const rawSlug = formData.get('slug') as string;
  const slug = rawSlug ? await ensureUniqueSlug(await createClient(), 'pages', rawSlug, pageId) : rawSlug;
  await pageRepo.updatePage(pageId, {
    title: formData.get('title') as string,
    content: (formData.get('content') as string) || '',
    slug,
    status: formData.get('status') as string || 'draft',
  });
  return {};
}

export async function deletePage(pageId: string): Promise<{ error?: string }> {
  await pageRepo.removePage(pageId);
  return {};
}

export async function getPages() {
  return pageRepo.findAllPages();
}

export async function getPage(slug: string) {
  return pageRepo.findBySlug(slug);
}

export async function getPageById(id: string) {
  return pageRepo.findPageById(id);
}
