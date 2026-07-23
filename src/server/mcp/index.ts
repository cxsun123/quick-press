import 'server-only';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { createAdminClient } from '@/server/db/client';
import { slugify, ensureUniqueSlug } from '@/server/utils/slug';
import * as postRepo from '@/server/repositories/post.repository';
import { extractSummary } from '@/server/services/ai.service';
import * as configService from '@/server/services/site-config.service';
import sharp from 'sharp';

// ---- Tool Definitions (raw JSON Schema) ----

interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, any>) => Promise<CallToolResult>;
}

const tools: ToolDef[] = [
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
        visibility: { type: 'string', enum: ['public', 'private', 'password'] },
        coverImage: { type: 'string', description: 'Cover image URL' },
      },
      required: ['title'],
    },
    handler: async (args) => {
      const authorId = await getSystemAuthorId();
      const admin = createAdminClient();
      const slug = await ensureUniqueSlug(admin, 'posts', slugify(args.title));
      const data = await postRepo.insertPost({
        author_id: authorId, title: args.title, content: args.content || '', slug,
        status: 'draft', visibility: args.visibility || 'public',
        cover_image_url: args.coverImage || null,
      });
      if (args.tags?.length) {
        const tagIds = await resolveTagIds(args.tags);
        if (tagIds.length) await postRepo.insertPostTags(tagIds.map((id: string) => ({ post_id: data.id, tag_id: id })));
      }
      if (args.categories?.length) {
        const catIds = await resolveCategoryIds(args.categories);
        if (catIds.length) await postRepo.insertPostCategories(catIds.map((id: string) => ({ post_id: data.id, category_id: id })));
      }
      return { content: [{ type: 'text', text: JSON.stringify({ postId: data.id, slug, url: `/admin/posts/${data.id}/edit` }) }] };
    },
  },
  {
    name: 'publish_post',
    description: 'Publish or update a post with full content. Default visibility is public.',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID to update (omit to create new)' },
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Markdown content' },
        summary: { type: 'string', description: 'Article summary' },
        keywords: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        categories: { type: 'array', items: { type: 'string' } },
        visibility: { type: 'string', enum: ['public', 'private', 'password'] },
        coverImage: { type: 'string', description: 'Cover image URL' },
      },
      required: ['title'],
    },
    handler: async (args) => {
      const authorId = await getSystemAuthorId();
      const admin = createAdminClient();
      const rawSlug = args.slug || slugify(args.title);
      const slug = args.postId
        ? await ensureUniqueSlug(admin, 'posts', rawSlug, args.postId)
        : await ensureUniqueSlug(admin, 'posts', rawSlug);
      const published_at = new Date().toISOString();

      if (args.postId) {
        await postRepo.updatePost(args.postId, {
          title: args.title, content: args.content || '', slug,
          status: 'published', published_at, visibility: args.visibility || 'public',
          cover_image_url: args.coverImage || null,
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
        return { content: [{ type: 'text', text: JSON.stringify({ postId: args.postId, slug, url: `/admin/posts/${args.postId}/edit` }) }] };
      }

      const data = await postRepo.insertPost({
        author_id: authorId, title: args.title, content: args.content || '', slug,
        status: 'published', published_at, visibility: args.visibility || 'public',
        cover_image_url: args.coverImage || null,
      });
      if (args.tags?.length) {
        const tagIds = await resolveTagIds(args.tags);
        if (tagIds.length) await postRepo.insertPostTags(tagIds.map((id: string) => ({ post_id: data.id, tag_id: id })));
      }
      if (args.categories?.length) {
        const catIds = await resolveCategoryIds(args.categories);
        if (catIds.length) await postRepo.insertPostCategories(catIds.map((id: string) => ({ post_id: data.id, category_id: id })));
      }
      return { content: [{ type: 'text', text: JSON.stringify({ postId: data.id, slug, url: `/admin/posts/${data.id}/edit` }) }] };
    },
  },
  {
    name: 'list_posts',
    description: 'List all posts (admin view)',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['draft', 'published', 'scheduled'] },
        visibility: { type: 'string', enum: ['public', 'private', 'password'] },
        limit: { type: 'number', description: 'Max results (default 50)' },
        offset: { type: 'number', description: 'Offset for pagination' },
      },
    },
    handler: async (args) => {
      const supabase = createAdminClient();
      const { limit = 50, offset = 0, status, visibility } = args;
      let query = supabase.from('posts').select('id, title, slug, status, visibility, published_at, cover_image_url', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (visibility) query = query.eq('visibility', visibility);
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data, count } = await query;
      return { content: [{ type: 'text', text: JSON.stringify({ posts: data, total: count }) }] };
    },
  },
  {
    name: 'get_post',
    description: 'Get full post details by ID',
    inputSchema: {
      type: 'object',
      properties: { postId: { type: 'string', description: 'Post ID' } },
      required: ['postId'],
    },
    handler: async (args) => {
      const supabase = createAdminClient();
      const { data } = await supabase.from('posts').select('*, post_tags(tags(*)), post_categories(categories(*))').eq('id', args.postId).single();
      if (!data) throw new Error('Post not found');
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    },
  },
  {
    name: 'delete_post',
    description: 'Delete a post permanently',
    inputSchema: {
      type: 'object',
      properties: { postId: { type: 'string', description: 'Post ID to delete' } },
      required: ['postId'],
    },
    handler: async (args) => {
      const supabase = createAdminClient();
      const { error } = await supabase.from('posts').delete().eq('id', args.postId);
      if (error) throw new Error(error.message);
      return { content: [{ type: 'text', text: JSON.stringify({ deleted: true, postId: args.postId }) }] };
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
    handler: async (args) => {
      const supabase = createAdminClient();
      const { query, limit = 20 } = args;
      const { data } = await supabase.from('posts').select('id, title, slug, excerpt, status, visibility, published_at')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('published_at', { ascending: false }).limit(limit);
      return { content: [{ type: 'text', text: JSON.stringify(data) }] };
    },
  },
  {
    name: 'get_stats',
    description: 'Get blog statistics',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const supabase = createAdminClient();
      const { count: posts } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published');
      const { count: drafts } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft');
      const { count: tags } = await supabase.from('tags').select('*', { count: 'exact', head: true });
      return { content: [{ type: 'text', text: JSON.stringify({ posts, drafts, tags }) }] };
    },
  },
  {
    name: 'upload_media',
    description: 'Upload image/media. Accepts URL or base64, auto-compresses if larger than max width.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Image URL to download and upload' },
        base64: { type: 'string', description: 'Base64 encoded image data' },
        filename: { type: 'string', description: 'Filename' },
        maxWidth: { type: 'number', description: 'Max width in pixels (default: 800 for content images)' },
        quality: { type: 'number', description: 'JPEG quality 1-100 (default: 80)' },
      },
    },
    handler: async (args) => {
      const supabase = createAdminClient();
      let buffer: Buffer;
      let contentType = 'image/jpeg';
      let filename = args.filename || `upload-${Date.now()}.jpg`;
      const maxWidth = args.maxWidth || 800;
      const quality = args.quality || 80;

      if (args.base64) {
        const base64Data = args.base64.includes(',') ? args.base64.split(',')[1] : args.base64;
        buffer = Buffer.from(base64Data, 'base64');
      } else if (args.url) {
        const resp = await fetch(args.url);
        if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
        buffer = Buffer.from(await resp.arrayBuffer());
      } else {
        throw new Error('Either url or base64 is required');
      }

      try {
        const metadata = await sharp(buffer).metadata();
        if (metadata.width && metadata.width > maxWidth) {
          buffer = await sharp(buffer).resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
          filename = filename.replace(/\.[^.]+$/, '.jpg');
        }
      } catch (e) { /* ignore */ }

      const path = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, buffer, { contentType });
      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
      await supabase.from('media').insert({ uploader_id: await getSystemAuthorId(), filename, storage_path: path, content_type: contentType, size: buffer.length });
      return { content: [{ type: 'text', text: JSON.stringify({ url: publicUrl, path, size: buffer.length }) }] };
    },
  },
  {
    name: 'extract_summary',
    description: 'Extract summary and keywords from article content using AI',
    inputSchema: {
      type: 'object',
      properties: { content: { type: 'string', description: 'Article content (markdown)' } },
      required: ['content'],
    },
    handler: async (args) => {
      const result = await extractSummary(args.content);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  },
  {
    name: 'publish_full',
    description: 'One-click publish. AI rewrites, extracts summary/keywords, uploads images, creates categories/tags, publishes.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Article URL to fetch and rewrite' },
        text: { type: 'string', description: 'Raw text to rewrite into article' },
        visibility: { type: 'string', enum: ['public', 'private', 'password'] },
        imageUrl: { type: 'string', description: 'Direct image URL to use as cover (e.g. from original article)' },
        imageQuery: { type: 'string', description: 'Keywords to search for cover image' },
        imageCount: { type: 'number', description: 'Number of images to search (1-3, default 1)' },
        skipRewrite: { type: 'boolean', description: 'Skip AI rewrite, use provided text directly' },
      },
    },
    handler: async (args) => {
      return { content: [{ type: 'text', text: JSON.stringify(await publishFull(args)) }] };
    },
  },
];

// ---- Server setup ----

let _server: Server | null = null;
let _transport: WebStandardStreamableHTTPServerTransport | null = null;
let _initPromise: Promise<void> | null = null;

function getOrCreateServer(): Server {
  if (_server) return _server;

  const server = new Server(
    { name: 'quick-press_mcp', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find(t => t.name === request.params.name);
    if (!tool) {
      return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true };
    }
    try {
      return await tool.handler(request.params.arguments || {});
    } catch (e: any) {
      return { content: [{ type: 'text', text: e.message || 'Tool execution error' }], isError: true };
    }
  });

  _server = server;
  return server;
}

async function getTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
  // If transport exists and init completed, reuse it
  if (_transport && _initPromise === null) return _transport;

  // If init is in progress, wait for it
  if (_initPromise) {
    await _initPromise;
    return _transport!;
  }

  const server = getOrCreateServer();

  // Create and connect transport
  _initPromise = (async () => {
    _transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
    });
    await server.connect(_transport);
  })();

  try {
    await _initPromise;
    return _transport!;
  } finally {
    _initPromise = null;
  }
}

export async function handleMCPRequest(req: Request): Promise<Response> {
  try {
    const transport = await getTransport();
    return transport.handleRequest(req);
  } catch (e: any) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32603, message: e.message || 'Internal error' },
      id: null,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ---- Helpers ----

async function getSystemAuthorId(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('user_profiles').select('user_id').limit(1).single();
  if (data?.user_id) return data.user_id;
  throw new Error('No user found');
}

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

function suggestCategories(keywords: string[], title: string): string[] {
  const text = (title + ' ' + keywords.join(' ')).toLowerCase();
  const map: Record<string, string[]> = {
    '技术': ['技术', 'tech', '编程', '开发', '代码', '软件', 'api', 'javascript', 'python', 'github'],
    '旅行': ['旅行', '旅游', '出国', '海外', 'travel', 'esim', 'sim', '网络', 'wifi'],
    '生活': ['生活', '日常', '分享', '经验', '教程', '攻略'],
    '产品': ['产品', '评测', '对比', '推荐', '手机', '电脑', '数码'],
    '教程': ['教程', '指南', '攻略', '步骤', '如何', '怎么'],
  };
  return Object.entries(map).filter(([, triggers]) => triggers.some(t => text.includes(t))).map(([cat]) => cat);
}

async function publishFull(args: any) {
  const supabase = createAdminClient();
  const authorId = await getSystemAuthorId();
  const { url, text, visibility = 'public', imageUrl, imageQuery, imageCount = 1, skipRewrite = false, summary: argSummary, keywords: argKeywords } = args;

  let rawText = text || '';
  if (url) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await resp.text();
      const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
        || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
        || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const raw = bodyMatch ? bodyMatch[1] : html;
      rawText = raw.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n').trim();
    } catch (e: any) { console.error('[publish_full] URL fetch failed:', e.message); }
  }
  if (!rawText) throw new Error('No content');

  let title = args.title || '';
  let content = rawText;
  let summary = argSummary || '';
  let keywords: string[] = argKeywords || [];

  if (!skipRewrite) {
    try {
      const aiResult = await aiRewrite(rawText);
      title = aiResult.title || title;
      content = aiResult.content || content;
      summary = aiResult.summary || summary;
      keywords = aiResult.keywords.length ? aiResult.keywords : keywords;
    } catch (e: any) { console.error('[publish_full] AI rewrite failed:', e.message); }
  }
  if (!keywords.length) keywords = title.split(/\s+/).filter(w => w.length > 1).slice(0, 5);

  // Search supplement
  let searchResults = '';
  try {
    const searchQ = `${title} ${keywords.slice(0, 3).join(' ')}`;
    const searchResp = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQ)}&count=5`, {
      headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || '' }
    });
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      searchResults = (searchData.web?.results || []).slice(0, 5).map((r: any) => `## ${r.title}\n${r.description || ''}\n${r.url || ''}`).join('\n\n');
    }
  } catch (e: any) { console.error('[publish_full] Search failed:', e.message); }

  if (searchResults) {
    try {
      const optimized = await aiOptimize(title, content, summary, keywords, searchResults);
      content = optimized.content; summary = optimized.summary; keywords = optimized.keywords;
    } catch (e: any) { console.error('[publish_full] AI optimize failed:', e.message); }
  }

  // Cover & images
  let coverImageUrl: string | null = null;
  const imageUrls: string[] = [];
  const coverSearchQuery = imageQuery || title;

  if (imageUrl) {
    try {
      const imgResp = await fetch(imageUrl);
      if (imgResp.ok) {
        let buffer = Buffer.from(await imgResp.arrayBuffer());
        try { const meta = await sharp(buffer).metadata(); if (meta.width && meta.width > 4096) buffer = await sharp(buffer).resize({ width: 4096, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer(); } catch {}
        const filename = `cover-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const path = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
        const { error } = await supabase.storage.from('media').upload(path, buffer, { contentType: 'image/jpeg' });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
          coverImageUrl = publicUrl;
          await supabase.from('media').insert({ uploader_id: authorId, filename, storage_path: path, content_type: 'image/jpeg', size: buffer.length });
        }
      }
    } catch (e: any) { console.error('[publish_full] Cover image failed:', e.message); }
  } else {
    try {
      const unsplashResp = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(coverSearchQuery)}&per_page=${Math.min(imageCount, 3)}&orientation=landscape`, {
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY || ''}` }
      });
      if (unsplashResp.ok) {
        for (const photo of ((await unsplashResp.json()).results || []).slice(0, imageCount)) {
          const u = photo.urls?.regular || photo.urls?.small;
          if (!u) continue;
          const r = await fetch(u); if (!r.ok) continue;
          let buffer = Buffer.from(await r.arrayBuffer());
          try { const meta = await sharp(buffer).metadata(); if (meta.width && meta.width > 4096) buffer = await sharp(buffer).resize({ width: 4096, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer(); } catch {}
          const fn = `article-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const pp = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${fn}`;
          const { error } = await supabase.storage.from('media').upload(pp, buffer, { contentType: 'image/jpeg' });
          if (!error) {
            const { data: { publicUrl: pu } } = supabase.storage.from('media').getPublicUrl(pp);
            imageUrls.push(pu);
            await supabase.from('media').insert({ uploader_id: authorId, filename: fn, storage_path: pp, content_type: 'image/jpeg', size: buffer.length });
          }
        }
      }
    } catch (e: any) { console.error('[publish_full] Image search failed:', e.message); }
  }

  let finalContent = content;
  if (coverImageUrl) {
    const lines = finalContent.split('\n');
    let idx = lines.findIndex(l => l.startsWith('## '));
    if (idx === -1) idx = 0;
    lines.splice(idx, 0, `![${title}](${coverImageUrl})`, '');
    finalContent = lines.join('\n');
  }
  if (imageUrls.length > 0) {
    finalContent = imageUrls.map((u, i) => `![${coverSearchQuery} ${i + 1}](${u})`).join('\n\n') + '\n\n' + finalContent;
  }

  // Tags & categories
  let tagIds: string[] = [];
  if (keywords?.length) {
    const { data: existingTags } = await supabase.from('tags').select('id, name').in('name', keywords);
    const existingMap = new Map((existingTags || []).map((t: any) => [t.name, t.id]));
    for (const name of keywords.filter(k => !existingMap.has(k))) {
      const { data: newTag } = await supabase.from('tags').insert({ name, slug: slugify(name) }).select('id').single();
      if (newTag) existingMap.set(name, newTag.id);
    }
    tagIds = keywords.map(k => existingMap.get(k)).filter(Boolean) as string[];
  }
  const categoryNames = suggestCategories(keywords || [], title);
  let categoryIds: string[] = [];
  if (categoryNames.length > 0) {
    const { data: existingCats } = await supabase.from('categories').select('id, name').in('name', categoryNames);
    const existingMap = new Map((existingCats || []).map((c: any) => [c.name, c.id]));
    for (const name of categoryNames.filter(n => !existingMap.has(n))) {
      const { data: newCat } = await supabase.from('categories').insert({ name, slug: slugify(name) }).select('id').single();
      if (newCat) existingMap.set(name, newCat.id);
    }
    categoryIds = categoryNames.map(n => existingMap.get(n)).filter(Boolean) as string[];
  }

  const rawSlug = slugify(title);
  const slug = await ensureUniqueSlug(supabase, 'posts', rawSlug);
  const postData = await postRepo.insertPost({
    author_id: authorId, title, content: finalContent, slug, status: 'published',
    published_at: new Date().toISOString(), visibility, summary, keywords,
    cover_image_url: coverImageUrl,
  });
  if (tagIds.length) await postRepo.insertPostTags(tagIds.map(id => ({ post_id: postData.id, tag_id: id })));
  if (categoryIds.length) await postRepo.insertPostCategories(categoryIds.map(id => ({ post_id: postData.id, category_id: id })));

  return { postId: postData.id, slug, url: `/admin/posts/${postData.id}/edit`, summary, keywords, categories: categoryNames, tags: keywords, imagesUploaded: imageUrls.length, coverImage: coverImageUrl };
}

async function aiRewrite(rawText: string): Promise<{ title: string; content: string; summary: string; keywords: string[] }> {
  const url = await configService.getSiteConfig('ai_provider_url');
  const apiKey = await configService.getSiteConfig('ai_api_key');
  const model = (await configService.getSiteConfig('ai_model')) || 'gpt-4o-mini';
  if (!url || !apiKey) throw new Error('AI Provider not configured');
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: `Rewrite into Chinese markdown blog article. Cover ALL points. Respond JSON only:\n{"title":"Title","content":"Full markdown","summary":"~100 chars","keywords":["k1","k2","k3","k4","k5"]}\n\nOriginal:\n${rawText.slice(0, 50000)}` }], temperature: 0.7, max_tokens: 8192 }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`AI API error (${response.status})`);
  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty AI response');
  let result: any = null;
  const m = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (m) try { result = JSON.parse(m[1]); } catch {}
  if (!result) { const jm = text.match(/\{[\s\S]*\}/); if (jm) try { result = JSON.parse(jm[0]); } catch {} }
  if (!result) throw new Error(`Cannot parse: ${text.slice(0, 200)}`);
  return { title: result.title || '', content: result.content || '', summary: (result.summary || '').trim(), keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5).map(k => k.trim()).filter(Boolean) : [] };
}

async function aiOptimize(title: string, content: string, summary: string, keywords: string[], searchResults: string) {
  const url = await configService.getSiteConfig('ai_provider_url');
  const apiKey = await configService.getSiteConfig('ai_api_key');
  const model = (await configService.getSiteConfig('ai_model')) || 'gpt-4o-mini';
  if (!url || !apiKey) throw new Error('AI Provider not configured');
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: `Enhance this article with search results. Respond JSON only:\n{"content":"Enhanced markdown","summary":"Updated summary","keywords":["k1","k2","k3","k4","k5"]}\n\nArticle:\n${JSON.stringify({ title, content: content.slice(0, 10000), summary, keywords })}\n\nSearch:\n${searchResults.slice(0, 5000)}` }], temperature: 0.5, max_tokens: 8192 }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`AI API error (${response.status})`);
  const data = await response.json();
  let text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty AI response');
  let result: any = null;
  const m = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (m) try { result = JSON.parse(m[1]); } catch {}
  if (!result) { const jm = text.match(/\{[\s\S]*\}/); if (jm) try { result = JSON.parse(jm[0]); } catch {} }
  if (!result) throw new Error(`Cannot parse: ${text.slice(0, 200)}`);
  return { content: result.content || content, summary: result.summary || summary, keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5).map(k => k.trim()).filter(Boolean) : keywords };
}
