import { getTranslations } from 'next-intl/server';
import { PublicLayout } from '@/components/blog/public-layout';
import { getPublishedPostsPaginated } from '@/server/actions/post.actions';
import { getTags } from '@/server/actions/taxonomy.actions';
import { PostCard } from '@/components/blog/post-card';
import { Pagination } from '@/components/blog/pagination';
import { Sidebar } from '@/components/blog/sidebar';
import { TwoColumnLayout } from '@/components/blog/two-column-layout';

export default async function TagPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const t = await getTranslations('home');

  const tags = await getTags();
  const tag = tags.find((tg) => tg.slug === slug);

  const { posts, total, totalPages } = await getPublishedPostsPaginated(page, 10, {
    tagSlug: slug,
  });

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">
          {t('tagLabel')}{tag?.name || slug}
        </h1>

        <TwoColumnLayout sidebar={<Sidebar />}>
          {posts.length === 0 ? (
            <p className="text-lg text-[var(--muted-foreground)]">{t('noPostsInTag')}</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/tag/${slug}`}
          />
        </TwoColumnLayout>
      </div>
    </PublicLayout>
  );
}
