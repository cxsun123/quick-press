'use server';

import { revalidatePath } from 'next/cache';
import * as mediaService from '@/server/services/media.service';

export async function uploadMedia(formData: FormData): Promise<void> {
  await mediaService.uploadMedia(formData);
  revalidatePath('/admin/media');
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await mediaService.deleteMedia(mediaId);
  revalidatePath('/admin/media');
}

export async function listMedia() {
  return mediaService.listMedia();
}
