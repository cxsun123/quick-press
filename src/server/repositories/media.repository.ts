import 'server-only';
import { createAdminClient } from '@/server/db/client';

export interface MediaRow {
  id: string;
  uploader_id: string;
  filename: string;
  storage_path: string;
  content_type: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  created_at: string;
}

export async function findAllMedia() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('media').select('*')
    .order('created_at', { ascending: false }).limit(50);
  return data || [];
}

export async function findMediaById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('media').select('storage_path').eq('id', id).single();
  return data;
}

export async function insertMedia(media: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('media').insert(media);
  if (error) throw new Error(error.message);
}

export async function removeMedia(id: string) {
  const supabase = createAdminClient();
  await supabase.from('media').delete().eq('id', id);
}
