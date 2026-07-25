import { createClient } from '@/server/db/client';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
  console.log('[upload] start');
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) console.error('[upload] auth error:', authErr);
  if (!user) {
    console.error('[upload] no user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[upload] user:', user.id);

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) {
    console.error('[upload] no file');
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }
  console.log('[upload] file:', file.name, file.size, file.type);

  let buffer = Buffer.from(await new Response(file.stream()).arrayBuffer());
  console.log('[upload] raw buffer size:', buffer.length, 'first 8 hex:', buffer.slice(0, 8).toString('hex'));
  let filename = file.name;
  let contentType = file.type;

  const maxWidth = parseInt(formData.get('maxWidth') as string, 10) || 800;
  console.log('[upload] maxWidth:', maxWidth);
  try {
    const metadata = await sharp(buffer).metadata();
    console.log('[upload] image metadata:', metadata.width, 'x', metadata.height, 'format:', metadata.format);
    if (metadata.width && metadata.width > maxWidth) {
      buffer = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      filename = filename.replace(/\.[^.]+$/, '.jpg');
      contentType = 'image/jpeg';
      console.log('[upload] after sharp size:', buffer.length, 'first 8 hex:', buffer.slice(0, 8).toString('hex'));
    }
  } catch (e) {
    console.error('[upload] Image compression failed:', e);
  }

  const ext = filename.split('.').pop() || 'bin';
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  console.log('[upload] uploading to storage, buffer size:', buffer.length, 'first 8 hex:', buffer.slice(0, 8).toString('hex'));
  const uploadRes = await fetch(
    `${supabaseUrl}/storage/v1/object/media/${path}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': contentType,
      },
      body: buffer,
    }
  );
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('[upload] storage upload error:', uploadRes.status, errText);
    return NextResponse.json({ error: errText }, { status: 500 });
  }
  console.log('[upload] storage uploaded:', path);

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

  const { error: insertError } = await supabase.from('media').insert({
    uploader_id: user.id,
    filename,
    storage_path: path,
    content_type: contentType,
    size: buffer.length,
  });
  if (insertError) console.error('[upload] db insert error:', insertError);
  console.log('[upload] done');

  return NextResponse.json({ url: publicUrl });
}
