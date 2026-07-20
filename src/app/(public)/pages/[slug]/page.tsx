import { createClient } from '@/server/db/client';
import { PublicLayout } from '@/components/blog/public-layout';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { markdownToHtml } from '@chengxinsun26/editor';
import { getTranslations } from 'next-intl/server';

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  const t = await getTranslations('home');

  if (!page) { notFound(); }

  let contentHtml = '';
  if (page.content) {
    contentHtml = markdownToHtml(page.content);
  }

  return (
    <PublicLayout>
      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">{page.title}</h1>
          {contentHtml ? (
            <div
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-[var(--foreground)] leading-relaxed prose-img:inline"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <div className="text-[var(--muted-foreground)]">{t('noContent')}</div>
          )}
        </div>
        <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-[var(--border)]">
          <Link href="/" className="text-sm text-[var(--primary)] hover:underline">{t('backToHome')}</Link>
        </div>
      </article>
    </PublicLayout>
  );
}
