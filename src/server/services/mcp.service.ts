import 'server-only';
import { createAdminClient } from '@/server/db/client';
import { slugify, ensureUniqueSlug } from '@/server/utils/slug';
import * as postRepo from '@/server/repositories/post.repository';
import { extractSummary } from './ai.service';
import * as configService from './site-config.service';
import sharp from 'sharp';

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
        coverImage: { type: 'string', description: 'Cover image URL' },
      },
      required: ['title'],
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
        summary: { type: 'string', description: 'Article summary (auto-extracted if omitted)' },
        keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords (auto-extracted if omitted)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag names' },
        categories: { type: 'array', items: { type: 'string' }, description: 'Category names' },
        visibility: { type: 'string', enum: ['public', 'private', 'password'], description: 'Post visibility (default: public)' },
        coverImage: { type: 'string', description: 'Cover image URL' },
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
    },
  {
    name: 'extract_summary',
    description: 'Extract summary and keywords from article content using AI',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Article content (markdown)' },
      },
      required: ['content'],
    },
  },
  {
    name: 'publish_full',
    description: 'One-click publish. Provide URL or text, AI auto-rewrites article, extracts summary/keywords, uploads images, creates categories/tags, publishes.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Article URL to fetch and rewrite' },
        text: { type: 'string', description: 'Raw text to rewrite into article' },
        visibility: { type: 'string', enum: ['public', 'private', 'password'], description: 'Post visibility (default: public)' },
        imageUrl: { type: 'string', description: 'Direct image URL to use as cover (e.g. from original article)' },
        imageQuery: { type: 'string', description: 'Keywords to search for cover image' },
        imageCount: { type: 'number', description: 'Number of images to search (1-3, default 1)' },
        skipRewrite: { type: 'boolean', description: 'Skip AI rewrite, use provided text directly' },
      },
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

  async upload_media(args) {
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
      const arrBuf = await resp.arrayBuffer();
      buffer = Buffer.from(arrBuf);
    } else {
      throw new Error('Either url or base64 is required');
    }

    // Compress content image: resize to maxWidth only if larger, skip if smaller
    try {
      const metadata = await sharp(buffer).metadata();
      if (metadata.width && metadata.width > maxWidth) {
        buffer = await sharp(buffer)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        filename = filename.replace(/\.[^.]+$/, '.jpg');
      }
    } catch (e) {
      console.error('[upload_media] Image compression failed:', e);
    }

    const path = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, buffer, { contentType });
    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

    await supabase.from('media').insert({
      uploader_id: (await getSystemAuthorId()),
      filename,
      storage_path: path,
      content_type: contentType,
      size: buffer.length,
    });

    return { url: publicUrl, path, filename, size: buffer.length };
  },

  async extract_summary(args) {
    return extractSummary(args.content);
  },

  async publish_full(args) {
    const supabase = createAdminClient();
    const authorId = await getSystemAuthorId();
    const { url, text, visibility = 'public', imageUrl, imageQuery, imageCount = 1, skipRewrite = false, summary: argSummary, keywords: argKeywords } = args;

    // Step 0: Get raw content + extract cover image + content images from HTML
    let rawText = text || '';
    let extractedCoverUrl: string | null = null;
    const articleImages: { url: string; alt: string; position: number }[] = [];
    const AD_DOMAINS = ['google-analytics', 'googletagmanager', 'doubleclick', 'facebook.com/tr', 'facebook.net', 'pixel', '1x1', 'spacer', 'blank', 'clear.gif', 'b.scorecardresearch', 'bat.bing.com', 'cm.everesttech.net'];
    if (url) {
      try {
        const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' } });
        if (!resp.ok) {
          const status = resp.status;
          if (status === 403 || status === 401 || status === 429 || status === 503) {
            throw new Error(`Anti-bot blocked (HTTP ${status}): This URL has bot protection. Please copy the article text and use the "text" parameter instead of "url".`);
          }
          throw new Error(`HTTP ${status}: Failed to fetch URL`);
        }
        const html = await resp.text();

        // Extract cover image: og:image > twitter:image > first <img>
        const ogMatch = html.match(/<meta\s+(?:[^>]*?)property=["']og:image["'][^>]*?content=["']([^"']+)["']/i)
          || html.match(/<meta\s+(?:[^>]*?)content=["']([^"']+)["'][^>]*?property=["']og:image["']/i);
        const twMatch = html.match(/<meta\s+(?:[^>]*?)name=["']twitter:image["'][^>]*?content=["']([^"']+)["']/i)
          || html.match(/<meta\s+(?:[^>]*?)content=["']([^"']+)["'][^>]*?name=["']twitter:image["']/i);
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        const rawCover = ogMatch?.[1] || twMatch?.[1] || imgMatch?.[1];
        if (rawCover) {
          try {
            extractedCoverUrl = new URL(rawCover, url).href;
          } catch {
            extractedCoverUrl = rawCover;
          }
        }

        const bodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
          || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
          || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyHtml = bodyMatch ? bodyMatch[1] : html;

        // Extract content images from article body (filter out AD/tracking/avatar images)
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        const SKIP_ALT = ['头像', 'avatar', 'icon', 'logo', '二维码', 'qrcode', 'qr code', '广告', 'sponsor', 'badge'];
        const SKIP_URL_PATTERNS = ['mmbiz_png', 'mmbiz_jpg/4X8', 'favicon', 'icon-', 'logo.', 'avatar'];
        let imgIdx: RegExpExecArray | null;
        let imgPosition = 0;
        while ((imgIdx = imgRegex.exec(bodyHtml)) !== null) {
          const rawSrc = imgIdx[1];
          // Skip data URIs
          if (rawSrc.startsWith('data:')) continue;
          // Skip AD/tracking domains
          const srcLower = rawSrc.toLowerCase();
          if (AD_DOMAINS.some((d: string) => srcLower.includes(d))) continue;
          // Skip small images by width/height attributes
          const widthMatch = imgIdx[0].match(/width=["']?(\d+)/i);
          const heightMatch = imgIdx[0].match(/height=["']?(\d+)/i);
          const w = parseInt(widthMatch?.[1] || '999', 10);
          const h = parseInt(heightMatch?.[1] || '999', 10);
          if (w < 100 || h < 100) continue;
          // Skip by alt text keywords
          const altMatch = imgIdx[0].match(/alt=["']([^"']*)["']/i);
          const alt = altMatch?.[1] || '';
          if (SKIP_ALT.some((k: string) => alt.toLowerCase().includes(k))) continue;
          // Skip by URL patterns (avatars, icons, logos)
          if (SKIP_URL_PATTERNS.some((p: string) => srcLower.includes(p))) continue;
          // Skip duplicate of cover image
          let imgUrl: string;
          try { imgUrl = new URL(rawSrc, url).href; } catch { imgUrl = rawSrc; }
          if (extractedCoverUrl && imgUrl === extractedCoverUrl) continue;
          articleImages.push({ url: imgUrl, alt, position: imgPosition++ });
        }

        rawText = bodyHtml
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        if (rawText.length < 50) {
          throw new Error('Fetched content too short — likely blocked by anti-bot protection. Please copy the article text and use the "text" parameter instead of "url".');
        }
      } catch (e: any) {
        console.error('[publish_full] URL fetch failed:', e.message);
        throw e;
      }
    }

    if (!rawText) throw new Error('No content: provide url or text');

    // Step 1: 查询已有分类和标签 → 喂给 AI
    const { data: dbCategories } = await supabase.from('categories').select('id, name');
    const { data: dbTags } = await supabase.from('tags').select('id, name');
    const existingCategories = (dbCategories || []).map((c: any) => c.name);
    const existingTags = (dbTags || []).map((t: any) => t.name);

    // Step 2: AI 一次调用 — 改写文章 + 匹配/新建 categories + tags + keywords
    let title = args.title || '';
    let content = rawText;
    let summary = argSummary || '';
    let aiCategories: string[] = [];
    let aiTags: string[] = [];
    let keywords: string[] = argKeywords || [];

    if (!skipRewrite) {
      try {
        const aiResult = await aiRewrite(rawText, existingCategories, existingTags);
        title = aiResult.title || title;
        content = aiResult.content || content;
        summary = aiResult.summary || summary;
        aiCategories = aiResult.categories;
        aiTags = aiResult.tags;
        keywords = aiResult.keywords.length ? aiResult.keywords : keywords;
      } catch (e: any) {
        console.error('[publish_full] AI rewrite failed, using raw text:', e.message);
      }
    }

    if (!keywords.length) {
      keywords = title.split(/\s+/).filter((w: any) => w.length > 1).slice(0, 5);
    }

    // Step 3: Handle cover image
    let coverImageUrl: string | null = null;
    const imageUrls: string[] = [];
    const searchQuery = imageQuery || title;
    const finalImageUrl = imageUrl || extractedCoverUrl;

    // If imageUrl provided (or extracted from HTML), use it directly as cover
    if (finalImageUrl) {
      try {
        const imgResp = await fetch(finalImageUrl);
        if (imgResp.ok) {
          const arrBuf = await imgResp.arrayBuffer();
          let buffer = Buffer.from(arrBuf);
          // Compress cover image: max 4K (4096px), only compress if larger
          try {
            const meta = await sharp(buffer).metadata();
            if (meta.width && meta.width > 4096) {
              buffer = await sharp(buffer)
                .resize({ width: 4096, withoutEnlargement: true })
                .jpeg({ quality: 85, mozjpeg: true })
                .toBuffer();
            }
          } catch {}
          const filename = `cover-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const path = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
          const { error } = await supabase.storage.from('media').upload(path, buffer, { contentType: 'image/jpeg' });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
            coverImageUrl = publicUrl;
            await supabase.from('media').insert({
              uploader_id: authorId,
              filename,
              storage_path: path,
              content_type: 'image/jpeg',
              size: buffer.length,
            });
          }
        }
      } catch (e: any) {
        console.error('[publish_full] Cover image upload failed:', e.message);
      }
    } else {
      // Fallback 1: Unsplash
      let foundCover = false;
      if (process.env.UNSPLASH_ACCESS_KEY) {
        try {
          const searchResp = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${Math.min(imageCount, 3)}&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
          );
          if (searchResp.ok) {
            const searchData = await searchResp.json();
            const photos = (searchData.results || []).slice(0, imageCount);
            for (const photo of photos) {
              const imgUrl = photo.urls?.regular || photo.urls?.small;
              if (!imgUrl) continue;
              const imgResp = await fetch(imgUrl);
              if (!imgResp.ok) continue;
              const arrBuf = await imgResp.arrayBuffer();
              let buffer = Buffer.from(arrBuf);
              try {
                const meta = await sharp(buffer).metadata();
                if (meta.width && meta.width > 4096) {
                  buffer = await sharp(buffer).resize({ width: 4096, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
                }
              } catch {}
              const filename = `article-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
              const path = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
              const { error } = await supabase.storage.from('media').upload(path, buffer, { contentType: 'image/jpeg' });
              if (!error) {
                const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
                imageUrls.push(publicUrl);
                await supabase.from('media').insert({ uploader_id: authorId, filename, storage_path: path, content_type: 'image/jpeg', size: buffer.length });
              }
            }
            foundCover = imageUrls.length > 0;
          }
        } catch (e: any) {
          console.error('[publish_full] Unsplash search failed:', e.message);
        }
      }

      // Fallback 2: SearXNG image search (via env SEARXNG_URL)
      const searxngUrl = process.env.SEARXNG_URL;
      if (!foundCover && searxngUrl) {
        try {
          const searxResp = await fetch(
            `${searxngUrl}/search?q=${encodeURIComponent(searchQuery)}&categories=images&format=json`
          );
          if (searxResp.ok) {
            const searxData = await searxResp.json();
            const results = (searxData.results || [])
              .filter((r: any) => {
                if (!r.img_src) return false;
                // Skip small images by parsing resolution string
                const res = r.resolution || '';
                const match = res.match(/(\d+)\D+(\d+)/);
                if (match) {
                  const [, w, h] = match.map(Number);
                  if (w < 200 || h < 200) return false;
                }
                return true;
              })
              .slice(0, imageCount);
            for (const result of results) {
              try {
                const imgResp = await fetch(result.img_src);
                if (!imgResp.ok) continue;
                const arrBuf = await imgResp.arrayBuffer();
                let buffer = Buffer.from(arrBuf);
                try {
                  const meta = await sharp(buffer).metadata();
                  if (meta.width && meta.width > 4096) {
                    buffer = await sharp(buffer).resize({ width: 4096, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
                  }
                } catch {}
                const filename = `article-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
                const path = `mcp/${Date.now()}-${Math.random().toString(36).slice(2)}/${filename}`;
                const { error } = await supabase.storage.from('media').upload(path, buffer, { contentType: 'image/jpeg' });
                if (!error) {
                  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
                  imageUrls.push(publicUrl);
                  await supabase.from('media').insert({ uploader_id: authorId, filename, storage_path: path, content_type: 'image/jpeg', size: buffer.length });
                }
              } catch {}
            }
          }
        } catch (e: any) {
          console.error('[publish_full] SearXNG image search failed:', e.message);
        }
      }
    }

    // Step 3: Build final content with images
    let finalContent = content;

    // Insert cover image before the first section (after the title)
    if (coverImageUrl) {
      const coverMarkdown = `![${title}](${coverImageUrl})`;
      const lines = finalContent.split('\n');
      let insertIdx = lines.findIndex((l: any) => l.startsWith('## '));
      if (insertIdx === -1) insertIdx = 0;
      lines.splice(insertIdx, 0, coverMarkdown, '');
      finalContent = lines.join('\n');
    }

    // Re-insert article images extracted from original HTML (distribute across sections)
    if (articleImages.length > 0) {
      const lines = finalContent.split('\n');
      const headingIndices: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## ')) headingIndices.push(i);
      }
      // Distribute images evenly across headings
      if (headingIndices.length > 1) {
        const gap = Math.floor(headingIndices.length / articleImages.length);
        for (let i = 0; i < articleImages.length; i++) {
          const targetHeadingIdx = headingIndices[Math.min(i * gap + 1, headingIndices.length - 1)];
          const insertAt = targetHeadingIdx + 1;
          const img = articleImages[i];
          const alt = img.alt || `${title} image ${i + 1}`;
          lines.splice(insertAt, 0, `![${alt}](${img.url})`, '');
        }
        finalContent = lines.join('\n');
      } else {
        // No headings — append at end
        for (const img of articleImages) {
          const alt = img.alt || `${title} image`;
          finalContent += `\n\n![${alt}](${img.url})`;
        }
      }
    }

    // Additional content images (from web search) prepended at top
    if (imageUrls.length > 0) {
      const imageMarkdown = imageUrls.map((url, i) => `![${searchQuery} ${i + 1}](${url})`).join('\n\n');
      finalContent = imageMarkdown + '\n\n' + finalContent;
    }

    /**
     * Step 4: 关联 Tags — AI 返回的 tags 优先匹配已有，无匹配则新建
     */
    let tagIds: string[] = [];
    if (aiTags.length > 0) {
      const tagNameMap = new Map((dbTags || []).map((t: any) => [t.name, t.id]));
      for (const name of aiTags) {
        if (!tagNameMap.has(name)) {
          const { data: newTag } = await supabase.from('tags').insert({ name, slug: slugify(name) }).select('id').single();
          if (newTag) tagNameMap.set(name, newTag.id);
        }
      }
      tagIds = aiTags.map((n: string) => tagNameMap.get(n)).filter(Boolean) as string[];
    }

    /**
     * Step 5: 关联 Categories — AI 返回的 categories 优先匹配已有，无匹配则新建
     */
    let categoryIds: string[] = [];
    if (aiCategories.length > 0) {
      const catNameMap = new Map((dbCategories || []).map((c: any) => [c.name, c.id]));
      for (const name of aiCategories) {
        if (!catNameMap.has(name)) {
          const { data: newCat } = await supabase.from('categories').insert({ name, slug: slugify(name) }).select('id').single();
          if (newCat) catNameMap.set(name, newCat.id);
        }
      }
      categoryIds = aiCategories.map((n: string) => catNameMap.get(n)).filter(Boolean) as string[];
    }

    // Step 6: Create & publish post
    const rawSlug = slugify(title);
    const slug = await ensureUniqueSlug(supabase, 'posts', rawSlug);
    const published_at = new Date().toISOString();

    const postData = await postRepo.insertPost({
      author_id: authorId,
      title,
      content: finalContent,
      slug,
      status: 'published',
      published_at,
      visibility,
      summary,
      keywords,
      cover_image_url: coverImageUrl,
    });

    if (tagIds.length) {
      await postRepo.insertPostTags(tagIds.map(id => ({ post_id: postData.id, tag_id: id })));
    }
    if (categoryIds.length) {
      await postRepo.insertPostCategories(categoryIds.map(id => ({ post_id: postData.id, category_id: id })));
    }

    return {
      postId: postData.id,
      slug,
      url: `/admin/posts/${postData.id}/edit`,
      title,
      summary,
      keywords,
      categories: aiCategories,
      tags: aiTags,
      imagesUploaded: imageUrls.length,
      coverImage: coverImageUrl,
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

async function aiRewrite(rawText: string, existingCategories: string[], existingTags: string[]): Promise<{ title: string; content: string; summary: string; categories: string[]; tags: string[]; keywords: string[] }> {
  const url = await configService.getSiteConfig('ai_provider_url');
  const apiKey = await configService.getSiteConfig('ai_api_key');
  const model = (await configService.getSiteConfig('ai_model')) || 'gpt-4o-mini';
  if (!url || !apiKey) throw new Error('AI Provider 未配置，请在设置中配置 AI 相关参数');

  const prompt = `You are a senior blog editor. Based on the source article below, write a comprehensive blog post in Chinese using your knowledge.

## Source Article
---
${rawText.slice(0, 50000)}
---

## Existing Categories (pick up to 3 best matches first; if none fit, suggest new names)
${existingCategories.length ? existingCategories.map((c: string) => '- ' + c).join('\n') : '(none - suggest new)'}

## Existing Tags (pick up to 5 best matches first; if none fit, suggest new names)
${existingTags.length ? existingTags.map((t: string) => '- ' + t).join('\n') : '(none - suggest new)'}

## Requirements
1. Output article MUST be in the same language as the source article
2. Cover all content and key points from the source; expand with your knowledge
3. Use Markdown format with clear structure and natural language
4. Categories: prefer matching existing categories above. Max 3.
5. Tags: prefer matching existing tags above. Max 5.
6. Keywords: extract exactly 5 core keywords

## Output Format
Return ONLY a valid JSON object. No markdown fences, no extra text.
Escape newlines as \\n and double quotes as \\" inside JSON string values.
Example: {"title":"My Title","content":"# Chapter 1\\n\\nContent...","summary":"A brief summary","categories":["Cat1"],"tags":["Tag1"],"keywords":["key1"]}

Schema:
{
  "title": "Article title (max 20 Chinese characters)",
  "content": "Full Markdown content",
  "summary": "One-sentence summary (~100 Chinese characters)",
  "categories": ["Category1", "Category2", "Category3"],
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "keywords": ["Keyword1", "Keyword2", "Keyword3", "Keyword4", "Keyword5"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 20000,
      reasoning_effort: 'none',
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error(`[aiRewrite] ERROR body: ${errText.slice(0, 500)}`);
    throw new Error(`AI API 返回错误 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  let text = '';
  const msg = data.choices?.[0]?.message;
  // Prefer content over reasoning_content (thinking process)
  if (msg?.content) text = msg.content;
  if (!text && msg?.reasoning_content) text = msg.reasoning_content;
  if (!text && data.choices?.[0]?.text) text = data.choices[0].text;

  if (!text) throw new Error('AI 返回为空（content 和 reasoning_content 均为空，请增大 max_tokens 或减少输入长度）');

  // Try multiple JSON extraction strategies
  let result: any = null;

  // Strategy 1: Look for JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try { result = JSON.parse(codeBlockMatch[1]); } catch {}
  }

  // Strategy 2: Look for standalone JSON object
  if (!result) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { result = JSON.parse(jsonMatch[0]); } catch {}
    }
  }

  // Strategy 3: Find JSON between markers
  if (!result) {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      try { result = JSON.parse(text.slice(startIdx, endIdx + 1)); } catch {}
    }
  }

  if (!result) throw new Error(`AI 返回格式异常，无法解析 JSON: ${text.slice(0, 200)}`);

  return {
    title: result.title || '',
    content: result.content || '',
    summary: (result.summary || '').trim(),
    categories: Array.isArray(result.categories) ? result.categories.slice(0, 3).map((c: any) => c.trim()).filter(Boolean) : [],
    tags: Array.isArray(result.tags) ? result.tags.slice(0, 5).map((t: any) => t.trim()).filter(Boolean) : [],
    keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 5).map((k: any) => k.trim()).filter(Boolean) : [],
  };
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
