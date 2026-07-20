import 'server-only';
import * as commentRepo from '@/server/repositories/comment.repository';

export async function submitComment(formData: FormData) {
  const post_id = formData.get('post_id') as string;
  const content = formData.get('content') as string;
  const author_name = (formData.get('author_name') as string) || null;
  if (!post_id || !content?.trim()) return { error: '评论内容不能为空' };
  return commentRepo.insertComment({ post_id, content: content.trim(), author_name, status: 'pending' });
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
