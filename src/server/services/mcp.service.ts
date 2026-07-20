import 'server-only';
import { createAdminClient } from '@/server/db/client';
import { slugify, ensureUniqueSlug } from '@/server/utils/slug';
import * as postRepo from '@/server/repositories/post.repository';

type ToolHandler = (args: Record<string, any>) => Promise<any>;

const TOOL_DEFINITIONS = [
  {
    name: 'create_draft',
    description: 'Create a new draft post',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Markdown content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag names' },
        categories: { type: 'array', items: { type: 'string' }, description: 'Category names' },
        visibility: { type: 'string', enum: ['public', 'private', 'password'], description: 'Post visibility' },
      },
      required: ['title'],
    },
  },
  {
    name: 'publish_post',
    description: 'Publish or update a post with full content',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID to update (omit to create new)' },
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Markdown content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag names' },
        categories: { type: 'array', items: { type: 'string' }, description: 'Category names' },
        visibility: { type: 'string', enum: ['public', 'private', 'password'], description: 'Post visibility' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_posts',
    description: 'List all posts (admin view)',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'published', 'scheduled'], description: 'Filter by status' },
        visibility: { type: 'string', enum: ['public', 'private', 'password'], description: 'Filter by visibility' },
        limit: { type: 'number', description: 'Max results (default 50)' },
        offset: { type: 'number', description: 'Offset for pagination' },
      },
    },
  },
  {
    name: 'get_post',
    description: 'Get full post details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' },
      },
      required: ['postId'],
    },
  },
  {
    name: 'delete_post',
    description: 'Delete a post permanently',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID to delete' },
      },
      required: ['postId'],
    },
  },
  {
    name: 'search_posts',
    description: 'Search posts by keyword',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword' },
        limit: { type: 'number', description: 'Max results (default 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get blog statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

async function getSystemAuthorId(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('user_profiles').select('user_id').limit(1).single();
  if (data?.user_id) return data.user_id;
  throw new Error('No user found. Please create at least one admin user first.');
}

const handlers: Record<string, ToolHandler> = {
  async create_draft(args) {
    const authorId = await getSystemAuthorId();
    const admin = createAdminClient();
    const slug = await ensureUniqueSlug(admin, 'posts', slugify(args.title));
    const data = await postRepo.insertPost({
      author_id: authorId,
      title: args.title,
      content: args.content || '',
      slug,
      status: 'draft',
      visibility: args.visibility || 'public',
    });
    if (args.tags?.length) {
      const tagIds = await resolveTagIds(args.tags);
      if (tagIds.length) await postRepo.insertPostTags(tagIds.map((id: string) => ({ post_id: data.id, tag_id: id })));
    }
    if (args.categories?.length) {
      const catIds = await resolveCategoryIds(args.categories);
      if (catIds.length) await postRepo.insertPostCategories(catIds.map((id: string) => ({ post_id: data.id, category_id: id })));
    }
    return { postId: data.id, slug, url: `/admin/posts/${data.id}/edit` };
  },

  async publish_post(args) {
    const authorId = await getSystemAuthorId();
    const admin = createAdminClient();
    const rawSlug = args.slug || slugify(args.title);
    const slug = args.postId
      ? await ensureUniqueSlug(admin, 'posts', rawSlug, args.postId)
      : await ensureUniqueSlug(admin, 'posts', rawSlug);
    const published_at = new Date().toISOString();

    if (args.postId) {
      await postRepo.updatePost(args.postId, {
        title: args.title,
        content: args.content || '',
        slug,
        status: 'published',
        published_at,
        visibility: args.visibility || 'public',
      });
      await postRepo.clearPostTags(args.postId);
      if (args.tags?.length) {
        const tagIds = await resolveTagIds(args.tags);
        if (tagIds.length) await postRepo.insertPostTags(tagIds.map((id: string) => ({ post_id: args.postId, tag_id: id })));
      }
      await postRepo.clearPostCategories(args.postId);
      if (args.categories?.length) {
        const catIds = await resolveCategoryIds(args.categories);
        if (catIds.length) await postRepo.insertPostCategories(catIds.map((id: string) => ({ post_id: args.postId, category_id: id })));
      }
      return { postId: args.postId, slug, url: `/admin/posts/${args.postId}/edit` };
    }

    const data = await postRepo.insertPost({
      author_id: authorId,
      title: args.title,
      content: args.content || '',
      slug,
      status: 'published',
      published_at,
      visibility: args.visibility || 'public',
    });
    if (args.tags?.length) {
      const tagIds = await resolveTagIds(args.tags);
      if (tagIds.length) await postRepo.insertPostTags(tagIds.map((id: string) => ({ post_id: data.id, tag_id: id })));
    }
    if (args.categories?.length) {
      const catIds = await resolveCategoryIds(args.categories);
      if (catIds.length) await postRepo.insertPostCategories(catIds.map((id: string) => ({ post_id: data.id, category_id: id })));
    }
    return { postId: data.id, slug, url: `/admin/posts/${data.id}/edit` };
  },

  async list_posts(args) {
    const supabase = createAdminClient();
    const { limit = 50, offset = 0, status, visibility } = args;

    let query = supabase
      .from('posts')
      .select('id, title, slug, status, visibility, published_at, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (visibility) query = query.eq('visibility', visibility);

    const { data } = await query;
    return { posts: data || [], total: data?.length || 0 };
  },

  async get_post(args) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('posts')
      .select('*, post_tags(tags(*)), post_categories(categories(*))')
      .eq('id', args.postId)
      .single();
    if (!data) throw new Error('Post not found');
    return data;
  },

  async delete_post(args) {
    const supabase = createAdminClient();
    const { error } = await supabase.from('posts').delete().eq('id', args.postId);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  async search_posts(args) {
    const supabase = createAdminClient();
    const { query, limit = 20 } = args;
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, status, visibility, published_at')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit);
    return { posts: data || [] };
  },

  async get_stats() {
    const supabase = createAdminClient();
    const [totalPosts, publishedPosts, scheduledPosts, totalComments] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
    ]);
    return {
      totalPosts: totalPosts.count || 0,
      publishedPosts: publishedPosts.count || 0,
      scheduledPosts: scheduledPosts.count || 0,
      totalComments: totalComments.count || 0,
    };
  },
};

async function resolveTagIds(names: string[]): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('tags').select('id, name').in('name', names);
  return (data || []).map((t: any) => t.id);
}

async function resolveCategoryIds(names: string[]): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('categories').select('id, name').in('name', names);
  return (data || []).map((c: any) => c.id);
}

export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}

export function getToolNames(): string[] {
  return Object.keys(handlers);
}

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(args);
}
