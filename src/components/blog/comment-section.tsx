'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { submitComment } from '@/server/actions/comment.actions';
import { getComments } from '@/server/actions/comment.actions';

interface Comment {
  id: string;
  content: string;
  author_name: string | null;
  created_at: string;
  parent_id: string | null;
}

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const tc = useTranslations('common');
  const t = useTranslations('comment');
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await getComments(postId);
    setComments(data as Comment[]);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError('');
    setSuccess('');

    const form = new FormData();
    form.set('post_id', postId);
    form.set('content', content.trim());
    if (name.trim()) form.set('author_name', name.trim());

    const res = await submitComment(form);
    setBusy(false);

    if (res.error) {
      setError(res.error);
    } else {
      setContent('');
      setSuccess(t('submittedHint'));
      load();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
        {t('comments')} {comments.length > 0 && `(${comments.length})`}
      </h2>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] mb-8">{t('noComments')}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-medium">
                  {(comment.author_name || '?')[0]}
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {comment.author_name || tc('anonymous')}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)]">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{t('leaveComment')}</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          rows={4}
          required
          className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {busy ? tc('submitting') : t('submit')}
        </button>
      </form>
    </div>
  );
}
