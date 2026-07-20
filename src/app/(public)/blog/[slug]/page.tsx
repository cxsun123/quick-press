import { createClient, createAdminClient } from '@/server/db/client';
import { PublicLayout } from '@/components/blog/public-layout';
import { PostContentWrapper } from '@/components/blog/post-content-wrapper';
import { markdownToHtml, MermaidBlock } from '@chengxinsun26/editor';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CommentSection } from '@/components/blog/comment-section';
import { getTranslations } from 'next-intl/server';

async function ArticleContent({ post }: { post: any }) {
  const t = await getTranslations('home');
  const htmlContent = markdownToHtml(post.content || '');
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">{post.title}</h1>
        <div className="text-sm text-[var(--muted-foreground)] mb-8">
          {post.published_at && new Date(post.published_at).toLocaleDateString()}
        </div>
        <div
          className="prose prose-lg max-w-none text-[var(--foreground)] leading-relaxed
            prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)]
            prose-strong:text-[var(--foreground)] prose-em:text-[var(--foreground)]
            prose-code:text-[var(--primary)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-[var(--muted)] prose-pre:text-[var(--foreground)]
            prose-blockquote:border-[var(--primary)] prose-blockquote:text-[var(--muted-foreground)]
            prose-a:text-[var(--primary)]
            prose-img:inline prose-img:rounded-lg
            prose-hr:border-[var(--border)]"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
        <MermaidBlock />
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <CommentSection postId={post.id} />
      </div>
      <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-[var(--border)]">
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">{t('backToHome')}</Link>
      </div>
    </article>
  );
}

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { token, preview } = await searchParams;

  const admin = createAdminClient();
  const supabase = await createClient();

  if (preview === 'true') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: previewPost } = await admin
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();
      if (previewPost) {
        return (
          <PublicLayout>
            <ArticleContent post={previewPost} />
          </PublicLayout>
        );
      }
    }
  }

  if (token && typeof token === 'string') {
    const { data: postByToken } = await admin
      .from('posts')
      .select('*')
      .eq('share_token', token)
      .eq('status', 'published')
      .single();

    if (postByToken) {
      return (
        <PublicLayout>
          <ArticleContent post={postByToken} />
        </PublicLayout>
      );
    }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (post) {
    return (
      <PublicLayout>
        <ArticleContent post={post} />
      </PublicLayout>
    );
  }

  const { data: existing } = await admin
    .from('posts')
    .select('id, title, visibility, published_at, created_at')
    .eq('slug', slug)
    .single();

  if (!existing) notFound();
  if (existing.visibility === 'private') notFound();

  if (existing.visibility === 'password') {
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get(`post_access_${existing.id}`);
    if (accessCookie?.value === 'true') {
      const { data: fullPost } = await admin
        .from('posts')
        .select('*')
        .eq('id', existing.id)
        .single();
      if (fullPost) {
        return (
          <PublicLayout>
            <ArticleContent post={fullPost} />
          </PublicLayout>
        );
      }
    }

    return (
      <PublicLayout>
        <PostContentWrapper
          postId={existing.id}
          postTitle={existing.title}
          needsPassword
        />
      </PublicLayout>
    );
  }

  notFound();
}
