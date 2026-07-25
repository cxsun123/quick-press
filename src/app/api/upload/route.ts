import { createClient, createAdminClient } from '@/server/db/client';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) console.error('[upload] auth error:', authErr);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  let buffer = Buffer.from(await new Response(file.stream()).arrayBuffer());
  let filename = file.name;
  let contentType = file.type;

  const maxWidth = parseInt(formData.get('maxWidth') as string, 10) || 800;
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.width > maxWidth) {
      buffer = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      filename = filename.replace(/\.[^.]+$/, '.jpg');
      contentType = 'image/jpeg';
    }
  } catch (e) {
    console.error('[upload] Image compression failed:', e);
  }

  const ext = filename.split('.').pop() || 'bin';
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const adminSupabase = createAdminClient();
  const { error: uploadError } = await adminSupabase.storage
    .from('media')
    .upload(path, new Blob([buffer], { type: contentType }), { contentType });
  if (uploadError) {
    console.error('[upload] storage upload error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = adminSupabase.storage.from('media').getPublicUrl(path);

  const { error: insertError } = await supabase.from('media').insert({
    uploader_id: user.id,
    filename,
    storage_path: path,
    content_type: contentType,
    size: buffer.length,
  });
  if (insertError) console.error('[upload] db insert error:', insertError);

  return NextResponse.json({ url: publicUrl });
}
