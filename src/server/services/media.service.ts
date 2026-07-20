import 'server-only';
import { createClient } from '@/server/db/client';
import * as mediaRepo from '@/server/repositories/media.repository';

export async function uploadMedia(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const file = formData.get('file') as File;
  if (!file) throw new Error('请选择文件');

  const ext = file.name.split('.').pop() || 'bin';
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('media').upload(storagePath, file);
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);

  let width: number | null = null;
  let height: number | null = null;
  if (file.type.startsWith('image/')) {
    try {
      const img = new Promise<{ w: number; h: number }>((resolve) => {
        const image = new (globalThis as any).Image();
        image.onload = () => resolve({ w: image.width, h: image.height });
        image.src = URL.createObjectURL(file);
      });
      const dims = await img;
      width = dims.w;
      height = dims.h;
    } catch {}
  }

  await mediaRepo.insertMedia({
    uploader_id: user.id, filename: file.name, storage_path: storagePath,
    content_type: file.type, size: file.size, width, height,
  });
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const supabase = await createClient();
  const media = await mediaRepo.findMediaById(mediaId);
  if (!media) return;
  await supabase.storage.from('media').remove([media.storage_path]);
  await mediaRepo.removeMedia(mediaId);
}

export async function listMedia() {
  return mediaRepo.findAllMedia();
}
