import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getPostsForAdmin } from '@/server/actions/post.actions';
import { Pagination } from '@/components/blog/pagination';
import { PostFilters } from '@/components/admin/post-filters';
import { AdminPostActions } from '@/components/admin/post-row-actions';

interface Props {
  searchParams?: Promise<{
    page?: string;
    status?: string;
    visibility?: string;
    perPage?: string;
  }>;
}

function buildUrl(base: string, params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v !== 'all') usp.set(k, v);
  });
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

function tabClass(active: boolean) {
  return active
    ? 'px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]'
    : 'px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]';
}

async function PostsList({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.page) || 1);
  const status = sp?.status || '';
  const visibility = sp?.visibility || '';
  const perPage = [20, 50, 100].includes(Number(sp?.perPage)) ? Number(sp?.perPage) : 20;

  const { posts, total, totalPages, currentPage } = await getPostsForAdmin({
    page,
    perPage,
    status: status || undefined,
    visibility: visibility || undefined,
  });

  const t = await getTranslations('admin');
  const tc = await getTranslations('common');

  const baseParams: Record<string, string | undefined> = {
    status: status || undefined,
    visibility: visibility || undefined,
    perPage: perPage === 20 ? undefined : String(perPage),
  };

  const visibilityLabels: Record<string, { label: string; class: string }> = {
    public: { label: tc('public'), class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    private: { label: tc('private'), class: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
    password: { label: tc('password'), class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('postManagement')}</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            {t('writeNewPost')}
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            {tc('preview')}
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <a href={buildUrl('/admin/posts', { ...baseParams, status: undefined })} className={tabClass(!status)}>
            {t('allPosts')}
          </a>
          <a href={buildUrl('/admin/posts', { ...baseParams, status: 'published' })} className={tabClass(status === 'published')}>
            {tc('published')}
          </a>
          <a href={buildUrl('/admin/posts', { ...baseParams, status: 'draft' })} className={tabClass(status === 'draft')}>
            {tc('draft')}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <PostFilters
            visibility={visibility}
            perPage={perPage}
            baseParams={baseParams}
          />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">{tc('noPosts')}</div>
      ) : (
        <AdminPostActions
          posts={posts as any}
          visibilityLabels={visibilityLabels}
        />
      )}

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-[var(--muted-foreground)]">
          {t('totalPosts')}: {total}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/admin/posts"
          extraParams={Object.fromEntries(
            Object.entries(baseParams).filter(([_, v]) => v !== undefined),
          ) as Record<string, string>}
        />
      </div>
    </AdminLayout>
  );
}

export default function PostsPage(props: Props) {
  return (
    <Suspense>
      <PostsList searchParams={props.searchParams} />
    </Suspense>
  );
}
