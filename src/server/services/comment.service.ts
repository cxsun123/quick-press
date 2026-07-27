import 'server-only';
import * as commentRepo from '@/server/repositories/comment.repository';

type SubmitResult = { type: 'silent' } | { type: 'error'; code: string } | { type: 'success' };

export async function submitComment(formData: FormData): Promise<SubmitResult> {
  const post_id = formData.get('post_id') as string;
  const content = formData.get('content') as string;
  const author_name = (formData.get('author_name') as string) || '';
  const author_email = (formData.get('author_email') as string) || '';
  const honeypot = (formData.get('confirm_email') as string) || '';
  const ts = Number(formData.get('_ts') || '0');

  // Honeypot: bot filled the hidden field
  if (honeypot) return { type: 'silent' };

  // Timestamp: submitted too fast (< 3s), likely a bot
  if (ts && Date.now() - ts < 3000) return { type: 'silent' };

  // Required field validation
  if (!author_name.trim()) return { type: 'error', code: 'nameRequired' };
  if (!author_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email.trim())) {
    return { type: 'error', code: 'emailRequired' };
  }
  if (!content?.trim()) return { type: 'error', code: 'contentRequired' };

  return commentRepo.insertComment({
    post_id,
    author_name: author_name.trim(),
    author_email: author_email.trim(),
    content: content.trim(),
    status: 'pending',
  }).then(() => ({ type: 'success' as const }));
}

export async function updateCommentStatus(commentId: string, status: string) {
  await commentRepo.updateCommentStatus(commentId, status);
}

export async function deleteComment(commentId: string) {
  await commentRepo.removeComment(commentId);
}

export async function getComments(postId: string) {
  return commentRepo.findApprovedByPost(postId);
}

export async function getAllComments(status?: string) {
  return commentRepo.findAllComments(status);
}
