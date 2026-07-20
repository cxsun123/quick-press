'use server';

import { revalidatePath } from 'next/cache';
import * as commentService from '@/server/services/comment.service';

export async function submitComment(formData: FormData) {
  const result = await commentService.submitComment(formData);
  revalidatePath(`/blog/${formData.get('post_id')}`);
  return result;
}

export async function updateCommentStatus(commentId: string, status: string) {
  await commentService.updateCommentStatus(commentId, status);
  revalidatePath('/admin/comments');
}

export async function deleteComment(commentId: string) {
  await commentService.deleteComment(commentId);
  revalidatePath('/admin/comments');
}

export async function getComments(postId: string) {
  return commentService.getComments(postId);
}

export async function getAllComments(status?: string) {
  return commentService.getAllComments(status);
}
