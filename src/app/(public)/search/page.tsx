import { getTranslations } from 'next-intl/server';
import { searchAll } from '@/server/actions/search.actions';
import { PublicLayout } from '@/components/blog/public-layout';
import Link from 'next/link';

export default async function SearchPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || '';
  const t = await getTranslations('home');
  const results = query ? await searchAll(query) : null;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <form action="/search" method="GET" className="mb-8">
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder={t('searchPlaceholder')}
              className="flex-1 px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              {t('searchButton')}
            </button>
          </div>
        </form>

        {query && results && (
          <div className="space-y-8">
            {results.posts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{t('searchArticles')}</h2>
                <div className="space-y-3">
                  {results.posts.map((post: any) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}
                      className="block px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-colors">
                      <div className="font-medium text-[var(--foreground)]">{post.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{post.published_at}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.pages.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{t('searchPages')}</h2>
                <div className="space-y-3">
                  {results.pages.map((page: any) => (
                    <Link key={page.id} href={`/pages/${page.slug}`}
                      className="block px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-colors">
                      <div className="font-medium text-[var(--foreground)]">{page.title}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.tags.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">{t('searchTags')}</h2>
                <div className="flex flex-wrap gap-2">
                  {results.tags.map((tag: any) => (
                    <Link key={tag.id} href={`/tags/${tag.slug}`}
                      className="px-3 py-1 rounded-full text-sm border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]">
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.posts.length === 0 && results.pages.length === 0 && results.tags.length === 0 && (
              <div className="text-center py-12 text-[var(--muted-foreground)]">
                {t('searchNoResults', { query })}
              </div>
            )}
          </div>
        )}

        {query === '' && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            {t('searchHint')}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
