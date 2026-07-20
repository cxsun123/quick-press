import 'server-only';
import { slugify, ensureUniqueSlug } from '@/server/utils/slug';
import { createClient, createAdminClient } from '@/server/db/client';
import * as postRepo from '@/server/repositories/post.repository';
import { hashPassword } from '@/server/utils/password';
import { encrypt } from '@/server/utils/crypto';
import { extractImages } from '@/server/utils/markdown';
import type { PostFilter, PaginatedPosts } from '@/models/post.model';

export async function savePost(formData: FormData): Promise<{ id: string; slug: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const id = formData.get('id') as string | null;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const rawSlug = formData.get('slug') as string || slugify(title);
  const status = formData.get('status') as string || 'draft';
  const tagIds = JSON.parse(formData.get('tag_ids') as string || '[]') as string[];
  const categoryIds = JSON.parse(formData.get('category_ids') as string || '[]') as string[];

  // New fields
  const summary = (formData.get('summary') as string) || null;
  const keywordsJson = formData.get('keywords') as string || '[]';
  const keywords: string[] = JSON.parse(keywordsJson);
  const visibility = (formData.get('visibility') as string) || 'public';
  const password = (formData.get('password') as string) || null;
  const coverImageUrl = (formData.get('cover_image_url') as string) || null;
  const userClearedCover = formData.get('cover_image_url') === '';

  const slug = await ensureUniqueSlug(
    createAdminClient(), 'posts', rawSlug, id || undefined,
  );

  const resolvedCoverUrl = userClearedCover ? null : (coverImageUrl || (extractImages(content)[0] || null));

  const extraFields: Record<string, any> = {
    summary,
    keywords: keywords.length > 0 ? keywords : null,
    visibility,
    cover_image_url: resolvedCoverUrl,
  };

  if (visibility === 'password') {
    if (password) {
      extraFields.password_hash = await hashPassword(password);
      extraFields.password_plaintext = encrypt(password);
    }
    // Keep existing share_token if present, or generate new one
    if (!id) {
      extraFields.share_token = crypto.randomUUID();
    }
  } else {
    extraFields.password_hash = null;
    extraFields.password_plaintext = null;
    // Only clear share_token when moving away from password mode
    if (id) {
      const existing = await postRepo.findById(id);
      if (existing?.visibility === 'password') {
        extraFields.share_token = null;
      }
    }
  }

  if (id) {
    const published_at = status === 'published' ? new Date().toISOString() : null;
    await postRepo.updatePost(id, { title, content, slug, status, published_at, ...extraFields });
    await postRepo.clearPostTags(id);
    if (tagIds.length) await postRepo.insertPostTags(tagIds.map(tag_id => ({ post_id: id, tag_id })));
    await postRepo.clearPostCategories(id);
    if (categoryIds.length) await postRepo.insertPostCategories(categoryIds.map(category_id => ({ post_id: id, category_id })));
    return { id, slug };
  } else {
    const data = await postRepo.insertPost({
      author_id: user.id, title, content, slug, status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      ...extraFields,
    });
    if (tagIds.length) await postRepo.insertPostTags(tagIds.map(tag_id => ({ post_id: data.id, tag_id })));
    if (categoryIds.length) await postRepo.insertPostCategories(categoryIds.map(category_id => ({ post_id: data.id, category_id })));
    return { id: data.id, slug };
  }
}

export async function deletePost(postId: string): Promise<void> {
  await postRepo.removePost(postId);
}

export async function getPost(id: string) {
  return postRepo.findById(id);
}

export async function listPosts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return postRepo.findAllByAuthor(user?.id || '');
}

export async function getPublishedPosts() {
  return postRepo.findPublished();
}

export async function getPostTags(postId: string) {
  return postRepo.findTagsByPost(postId);
}

export async function getPostCategories(postId: string) {
  return postRepo.findCategoriesByPost(postId);
}

export async function getPublishedPostsPaginated(
  page: number = 1,
  perPage: number = 10,
  filter: PostFilter = {},
): Promise<PaginatedPosts> {
  const supabase = await createClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from('posts').select(
    `id, title, slug, excerpt, summary, keywords, cover_image_url, content, published_at, is_pinned,
     post_categories(categories(id, name, slug)),
     post_tags(tags(id, name, slug, color))`,
    { count: 'exact' },
  ).eq('status', 'published').eq('visibility', 'public');

  if (filter.categorySlug) {
    const { data: catIds } = await supabase.from('categories').select('id').eq('slug', filter.categorySlug);
    if (catIds && catIds.length > 0) {
      const { data: postIds } = await supabase.from('post_categories').select('post_id').in('category_id', catIds.map((c: any) => c.id));
      if (postIds && postIds.length > 0) {
        query = query.in('id', postIds.map((r: any) => r.post_id));
      } else {
        return { posts: [], total: 0, totalPages: 0, currentPage: page };
      }
    } else {
      return { posts: [], total: 0, totalPages: 0, currentPage: page };
    }
  }

  const allTagSlugs = filter.tagSlugs || (filter.tagSlug ? [filter.tagSlug] : []);
  if (allTagSlugs.length > 0) {
    const { data: tagRows } = await supabase.from('tags').select('id').in('slug', allTagSlugs);
    if (tagRows && tagRows.length > 0) {
      const tagIdList = tagRows.map((t: any) => t.id);
      const { data: postTagRows } = await supabase.from('post_tags').select('post_id').in('tag_id', tagIdList);
      if (postTagRows && postTagRows.length > 0) {
        const tagCountMap = new Map<string, number>();
        postTagRows.forEach((r: any) => tagCountMap.set(r.post_id, (tagCountMap.get(r.post_id) || 0) + 1));
        const matchingPostIds = Array.from(tagCountMap.entries())
          .filter(([_, count]) => count >= tagIdList.length).map(([id]) => id);
        if (matchingPostIds.length > 0) {
          query = query.in('id', matchingPostIds);
        } else {
          return { posts: [], total: 0, totalPages: 0, currentPage: page };
        }
      } else {
        return { posts: [], total: 0, totalPages: 0, currentPage: page };
      }
    } else {
      return { posts: [], total: 0, totalPages: 0, currentPage: page };
    }
  }

  if (filter.month) {
    const start = `${filter.month}-01T00:00:00.000Z`;
    const [year, mon] = filter.month.split('-').map(Number);
    const endMonth = mon === 12 ? 1 : mon + 1;
    const endYear = mon === 12 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`;
    query = query.gte('published_at', start).lt('published_at', end);
  }

  if (filter.query) {
    query = query.or(`title.ilike.%${filter.query}%,excerpt.ilike.%${filter.query}%`);
  }

  const { data: posts, count } = await query
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .range(from, to);

  const total = count || 0;
  const totalPages = Math.ceil(total / perPage);

  // Extract first image from content if cover_image_url is not set
  const processedPosts = (posts || []).map((p: any) => {
    if (!p.cover_image_url && p.content) {
      const match = p.content.match(/!\[.*?\]\((.*?)\)/);
      if (match) p.cover_image_url = match[1];
    }
    delete p.content;
    return p;
  });

  return { posts: processedPosts as any[], total, totalPages, currentPage: page } as PaginatedPosts;
}

export async function getRecentPosts(limit: number = 5) {
  return postRepo.findRecentPosts(limit);
}

export async function getMonthlyArchives(): Promise<{ month: string; count: number }[]> {
  const rows = await postRepo.findMonthlyArchives();
  const map = new Map<string, number>();
  rows.forEach((p: any) => {
    const month = p.published_at.slice(0, 7);
    map.set(month, (map.get(month) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export async function batchUpdateVisibility(postIds: string[], visibility: string) {
  await postRepo.updatePostsVisibility(postIds, visibility);
}

export async function regenerateShareToken(postId: string): Promise<string> {
  return postRepo.regenerateShareToken(postId);
}
