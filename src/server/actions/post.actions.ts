'use server';

import { revalidatePath } from 'next/cache';
import * as postService from '@/server/services/post.service';

export async function savePost(formData: FormData): Promise<{ id: string; slug: string }> {
  const result = await postService.savePost(formData);
  revalidatePath('/admin/posts');
  revalidatePath('/');
  return result;
}

export async function deletePost(postId: string): Promise<void> {
  await postService.deletePost(postId);
  revalidatePath('/admin/posts');
  revalidatePath('/');
}

export async function getPost(id: string) {
  return postService.getPost(id);
}

export async function listPosts() {
  return postService.listPosts();
}

export async function getPublishedPosts() {
  return postService.getPublishedPosts();
}

export async function getPostTags(postId: string) {
  return postService.getPostTags(postId);
}

export async function getPostCategories(postId: string) {
  return postService.getPostCategories(postId);
}

export async function getPublishedPostsPaginated(
  page: number = 1,
  perPage: number = 10,
  filter: any = {},
) {
  return postService.getPublishedPostsPaginated(page, perPage, filter);
}

export async function getRecentPosts(limit: number = 5) {
  return postService.getRecentPosts(limit);
}

export async function getMonthlyArchives() {
  return postService.getMonthlyArchives();
}

export async function batchUpdateVisibility(postIds: string[], visibility: string) {
  await postService.batchUpdateVisibility(postIds, visibility);
  revalidatePath('/admin/posts');
}

export async function regenerateShareToken(postId: string): Promise<string> {
  return postService.regenerateShareToken(postId);
}
