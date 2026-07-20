import { AdminLayout } from '@/components/admin/admin-layout';
import { getAllComments } from '@/server/actions/comment.actions';
import { CommentList } from '@/components/admin/comment-list';
import { getTranslations } from 'next-intl/server';

export default async function CommentsPage(props: { searchParams?: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const status = searchParams?.status || 'pending';
  const comments = await getAllComments(status === 'all' ? undefined : status);
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">{t('commentManagement')}</h1>

      <div className="mb-4 flex gap-2">
        <a
          href="/admin/comments"
          className={`px-3 py-1.5 text-sm rounded-lg ${
            status === 'pending' || (status !== 'approved' && status !== 'all')
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          {tc('pendingReview')}
        </a>
        <a
          href="/admin/comments?status=approved"
          className={`px-3 py-1.5 text-sm rounded-lg ${
            status === 'approved'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          {tc('approved')}
        </a>
        <a
          href="/admin/comments?status=all"
          className={`px-3 py-1.5 text-sm rounded-lg ${
            status === 'all'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
        >
          {tc('all')}
        </a>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">{tc('noComments')}</div>
      ) : (
        <CommentList comments={comments} />
      )}
    </AdminLayout>
  );
}
