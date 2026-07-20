'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { updateCommentStatus, deleteComment } from '@/server/actions/comment.actions';

interface Comment {
  id: string;
  post_id: string;
  author_name?: string;
  author_email?: string;
  content: string;
  status: string;
  created_at: string;
}

export function CommentList({ comments }: { comments: Comment[] }) {
  const t = useTranslations('comment');
  const tc = useTranslations('common');
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const handleAction = useCallback(async (id: string, action: string) => {
    setPending(id);
    try {
      if (action === 'delete') {
        await deleteComment(id);
      } else {
        await updateCommentStatus(id, action);
      }
      router.refresh();
    } catch {
      alert('Operation failed');
    }
    setPending(null);
  }, [router]);

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-[var(--foreground)]">
              {comment.author_name || tc('anonymous')}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {new Date(comment.created_at).toLocaleString()}
            </div>
          </div>
          <p className="text-sm text-[var(--foreground)] mb-3">{comment.content}</p>
          <div className="flex gap-2">
            {comment.status === 'pending' && (
              <button
                onClick={() => handleAction(comment.id, 'approved')}
                disabled={pending === comment.id}
                className="px-3 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              >
                {t('approve')}
              </button>
            )}
            {comment.status !== 'spam' && (
              <button
                onClick={() => handleAction(comment.id, 'spam')}
                disabled={pending === comment.id}
                className="px-3 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
              >
                {t('spam')}
              </button>
            )}
            <button
              onClick={() => handleAction(comment.id, 'delete')}
              disabled={pending === comment.id}
              className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
