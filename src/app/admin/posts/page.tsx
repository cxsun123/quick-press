'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import { listPosts, deletePost, batchUpdateVisibility } from '@/server/actions/post.actions';
import { BatchActionBar } from '@/components/admin/batch-action-bar';
import { Copy, Check } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  published_at: string | null;
  created_at: string;
  share_token: string | null;
  post_tags: { tags: { id: string; name: string; slug: string; color: string } }[];
}

export default function PostsPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const tb = useTranslations('post');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const locale = new Date().toLocaleDateString().includes('/') ? 'en' : 'en';

  const visibilityLabels: Record<string, { label: string; class: string }> = {
    public: { label: tc('public'), class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    private: { label: tc('private'), class: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
    password: { label: tc('password'), class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  };

  const visibilityOptions = [
    { value: '', label: t('allVisibility') },
    { value: 'public', label: t('public') },
    { value: 'private', label: t('private') },
    { value: 'password', label: t('passwordProtected') },
  ];

  const copyPostUrl = async (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slug);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const load = useCallback(async () => {
    setPosts((await listPosts()) as unknown as Post[]);
    setSelectedIds(new Set());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredPosts = visibilityFilter
    ? posts.filter((p) => p.visibility === visibilityFilter)
    : posts;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const handleBatchVisibility = async (visibility: 'public' | 'private') => {
    if (selectedIds.size === 0) return;
    await batchUpdateVisibility(Array.from(selectedIds), visibility);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('postManagement')}</h1>
        <div className="flex items-center gap-3">
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
          >
            {visibilityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">{tc('noPosts')}</div>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((post) => {
            const vLabel = visibilityLabels[post.visibility] || visibilityLabels.public;
            return (
              <div
                key={post.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(post.id)}
                  onChange={() => toggleSelect(post.id)}
                  className="accent-[var(--primary)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    {post.title}
                  </Link>
                  {post.post_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.post_tags.map((pt) => (
                        <span
                          key={pt.tags.id}
                          className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border"
                          style={{ borderColor: pt.tags.color, color: pt.tags.color }}
                        >
                          {pt.tags.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    /{post.slug} · {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${vLabel.class}`}>
                    {vLabel.label}
                  </span>
                  {post.visibility === 'password' && (
                    <button
                      onClick={() => copyPostUrl(post.slug)}
                      className="p-1 rounded hover:bg-[var(--accent)] transition-colors"
                      title={tb('copyPostLink')}
                    >
                      {copiedId === post.slug ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                      )}
                    </button>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {post.status === 'published' ? tc('published') : tc('draft')}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                  >
                    {tc('edit')}
                  </Link>
                  <button
                    onClick={async () => {
                      if (confirm(tc('confirmDelete'))) {
                        await deletePost(post.id);
                        load();
                      }
                    }}
                    className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    {tc('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BatchActionBar
        selectedCount={selectedIds.size}
        onSetVisibility={handleBatchVisibility}
        onClear={() => setSelectedIds(new Set())}
      />
    </AdminLayout>
  );
}
