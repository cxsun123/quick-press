import 'server-only';
import sharp from 'sharp';
import { createClient } from '@/server/db/client';
import * as mediaRepo from '@/server/repositories/media.repository';

export async function uploadMedia(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const file = formData.get('file') as File;
  if (!file) throw new Error('请选择文件');

  let buffer = Buffer.from(await new Response(file.stream()).arrayBuffer());
  let filename = file.name;
  let contentType = file.type;
  let width: number | null = null;
  let height: number | null = null;

  // Compress image: resize to 800px only if larger, convert to JPEG
  if (file.type.startsWith('image/')) {
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
      if (metadata.width && metadata.width > 800) {
        buffer = await sharp(buffer)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        filename = filename.replace(/\.[^.]+$/, '.jpg');
        contentType = 'image/jpeg';
      }
    } catch (e) {
      console.error('[media] Image compression failed:', e);
    }
  }

  const ext = filename.split('.').pop() || 'bin';
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('media').upload(storagePath, buffer, { contentType });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);

  await mediaRepo.insertMedia({
    uploader_id: user.id, filename, storage_path: storagePath,
    content_type: contentType, size: buffer.length, width, height,
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
