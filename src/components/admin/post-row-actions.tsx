'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deletePost, togglePin, batchUpdateVisibility } from '@/server/actions/post.actions';
import { BatchActionBar } from '@/components/admin/batch-action-bar';
import { Copy, Check, Pin, PinOff } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  share_token: string | null;
  post_tags: { tags: { id: string; name: string; slug: string; color: string } }[];
}

interface Props {
  posts: Post[];
  visibilityLabels: Record<string, { label: string; class: string }>;
}

export function AdminPostActions({ posts, visibilityLabels }: Props) {
  const router = useRouter();
  const tc = useTranslations('common');
  const tb = useTranslations('post');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };

  const handleBatchVisibility = async (visibility: 'public' | 'private') => {
    if (selectedIds.size === 0) return;
    await batchUpdateVisibility(Array.from(selectedIds), visibility);
    setSelectedIds(new Set());
    router.refresh();
  };

  const handleTogglePin = async (postId: string) => {
    await togglePin(postId);
    router.refresh();
  };

  const handleDelete = async (postId: string) => {
    if (confirm(tc('confirmDelete'))) {
      await deletePost(postId);
      router.refresh();
    }
  };

  const copyPostUrl = async (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slug);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <>
      {hasSelection && (
        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === posts.length && posts.length > 0}
              onChange={toggleSelectAll}
              className="accent-[var(--primary)]"
            />
            {tc('selectAll')}
          </label>
        </div>
      )}
      <div className="space-y-2">
        {posts.map((post) => {
          const vLabel = visibilityLabels[post.visibility] || visibilityLabels.public;
          return (
            <div
              key={post.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                post.is_pinned
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30'
                  : 'border-[var(--border)] bg-[var(--background)]'
              }`}
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
                {post.is_pinned && (
                  <span className="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Pin className="h-2.5 w-2.5" />
                    {tc('pinned')}
                  </span>
                )}
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
                  /{post.slug} · {new Date(post.updated_at).toLocaleDateString()}
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
                <button
                  onClick={() => handleTogglePin(post.id)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    post.is_pinned
                      ? 'border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/50'
                      : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                  }`}
                  title={post.is_pinned ? tc('unpin') : tc('pin')}
                >
                  {post.is_pinned ? <PinOff className="h-3 w-3 inline mr-0.5" /> : <Pin className="h-3 w-3 inline mr-0.5" />}
                  {post.is_pinned ? tc('unpin') : tc('pin')}
                </button>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                >
                  {tc('edit')}
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                >
                  {tc('delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BatchActionBar
        selectedCount={selectedIds.size}
        onSetVisibility={handleBatchVisibility}
        onClear={() => setSelectedIds(new Set())}
      />
    </>
  );
}
