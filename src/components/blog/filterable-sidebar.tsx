'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { startGlobalLoading } from '@/hooks/use-loading';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
  published_at: string;
}

interface Archive {
  month: string;
  count: number;
}

interface FilterableSidebarProps {
  categories: Category[];
  tags: Tag[];
  recentPosts: RecentPost[];
  archives: Archive[];
}

function formatMonth(month: string): string {
  const [year, mon] = month.split('-');
  return `${year}年${parseInt(mon)}月`;
}

function readTagsFromParams(sp: URLSearchParams): string[] {
  const raw = sp.get('tags');
  return raw ? raw.split(',').filter(Boolean) : [];
}

export function FilterableSidebar({
  categories,
  tags,
  recentPosts,
  archives,
}: FilterableSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    readTagsFromParams(searchParams),
  );
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    setSelectedTags(readTagsFromParams(searchParams));
  }, [searchParams]);

  const navigate = useCallback(
    (url: string) => {
      startGlobalLoading();
      router.push(url, { scroll: false });
    },
    [router],
  );

  const toggleTag = (tagSlug: string) => {
    const next = selectedTags.includes(tagSlug)
      ? selectedTags.filter((t) => t !== tagSlug)
      : [...selectedTags, tagSlug];
    setSelectedTags(next);
    pushParams(next);
  };

  const pushParams = useCallback(
    (newTags: string[], extra?: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newTags.length > 0) {
        params.set('tags', newTags.join(','));
      } else {
        params.delete('tags');
      }
      if (extra) {
        Object.entries(extra).forEach(([key, value]) => {
          if (value === null || value === '') {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        });
      }
      params.delete('page');
      const qs = params.toString();
      navigate(qs ? `/?${qs}` : '/');
    },
    [searchParams, navigate],
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get('q') as string)?.trim() || '';
    pushParams(selectedTags, { q: q || null });
  };

  const goToCategory = (slug: string) => navigate(`/category/${slug}`);
  const goToArchive = (month: string) => navigate(`/?month=${month}`);
  const goToPost = (slug: string) => navigate(`/blog/${slug}`);

  return (
    <>
      <aside className="space-y-6">
        {/* Search */}
        <section className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">搜索</h3>
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="搜索文章..."
                className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
              <button
                type="submit"
                className="px-3 py-2 text-sm rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
              >
                搜索
              </button>
            </div>
          </form>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">分类</h3>
            <ul className="space-y-1.5">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => goToCategory(cat.slug)}
                    className="w-full flex items-center justify-between text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left cursor-pointer"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">({cat.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tags - selectable */}
        {tags.length > 0 && (
          <section className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.slug);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.slug)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[var(--primary)]'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      borderColor: tag.color,
                      color: isSelected ? 'var(--background)' : tag.color,
                      backgroundColor: isSelected ? tag.color : 'transparent',
                    }}
                  >
                    {tag.name}
                    <span className="opacity-60">({tag.count})</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">近期文章</h3>
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <button
                    onClick={() => goToPost(post.slug)}
                    className="block w-full text-left text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors leading-snug cursor-pointer"
                  >
                    {post.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Archives */}
        {archives.length > 0 && (
          <section className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">按月归档</h3>
            <ul className="space-y-1.5">
              {archives.map((a) => (
                <li key={a.month}>
                  <button
                    onClick={() => goToArchive(a.month)}
                    className="w-full flex items-center justify-between text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left cursor-pointer"
                  >
                    <span>{formatMonth(a.month)}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">({a.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </>
  );
}
