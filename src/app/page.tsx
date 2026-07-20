import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { PublicLayout } from '@/components/blog/public-layout';
import { getPublishedPostsPaginated } from '@/server/actions/post.actions';
import { PostCard } from '@/components/blog/post-card';
import { Pagination } from '@/components/blog/pagination';
import { Sidebar } from '@/components/blog/sidebar';
import { TwoColumnLayout } from '@/components/blog/two-column-layout';

export default async function Home(props: {
  searchParams?: Promise<{
    page?: string;
    month?: string;
    tags?: string;
    q?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const month = searchParams?.month || undefined;
  const tagSlugs = searchParams?.tags
    ? searchParams.tags.split(',').filter(Boolean)
    : [];
  const query = searchParams?.q || undefined;
  const tc = await getTranslations('common');
  const th = await getTranslations('home');

  const { posts, total, totalPages } = await getPublishedPostsPaginated(page, 10, {
    month,
    tagSlugs: tagSlugs.length > 0 ? tagSlugs : undefined,
    query,
  });

  const extraParams: Record<string, string> = {};
  if (month) extraParams.month = month;
  if (tagSlugs.length > 0) extraParams.tags = tagSlugs.join(',');
  if (query) extraParams.q = query;

  const hasFilters = month || tagSlugs.length > 0 || query;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TwoColumnLayout
          sidebar={
            <Suspense>
              <Sidebar />
            </Suspense>
          }
        >
          {hasFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
              {month && (
                <span className="inline-flex items-center gap-1">
                  {th('filterArchive')}<span className="font-medium text-[var(--foreground)]">{month.replace('-', '/')}</span>
                </span>
              )}
              {tagSlugs.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  {th('filterTag')}<span className="font-medium text-[var(--foreground)]">{tagSlugs.join(', ')}</span>
                </span>
              )}
              {query && (
                <span className="inline-flex items-center gap-1">
                  {th('filterSearch')}<span className="font-medium text-[var(--foreground)]">{query}</span>
                </span>
              )}
              <a href="/" className="ml-2 text-[var(--primary)] hover:underline">
                {th('clearFilter')}
              </a>
            </div>
          )}

          {posts.length === 0 ? (
            <p className="text-lg text-[var(--muted-foreground)]">{tc('noPosts')}</p>
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
            basePath="/"
            extraParams={extraParams}
          />
        </TwoColumnLayout>
      </div>
    </PublicLayout>
  );
}
