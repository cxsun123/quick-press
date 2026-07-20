'use client';

import { useState, useEffect, useCallback } from 'react';
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
      setSuccess('评论已提交，审核通过后显示。');
      load();
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-[var(--border)]">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
        评论 {comments.length > 0 && `(${comments.length})`}
      </h2>

      {comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {comment.author_name || '匿名'}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {new Date(comment.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)] mb-8">暂无评论，来抢沙发吧！</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">发表评论</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="昵称（选填）"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          required
          rows={4}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm resize-y"
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        )}
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {busy ? '提交中...' : '提交评论'}
        </button>
      </form>
    </div>
  );
}
