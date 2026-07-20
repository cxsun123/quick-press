'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { uploadMedia, deleteMedia, listMedia } from '@/server/actions/media.actions';
import { createClient } from '@/lib/supabase/client';

interface MediaItem {
  id: string;
  filename: string;
  storage_path: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => { setItems(await listMedia()); }, []);
  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      await uploadMedia(form);
      load();
    } catch (err: any) {
      alert(err.message || '上传失败');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const getUrl = (item: MediaItem) => {
    const supabase = createClient();
    return supabase.storage.from('media').getPublicUrl(item.storage_path).data.publicUrl;
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">媒体库</h1>
        <label className={`px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? '上传中...' : '上传文件'}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">暂无媒体文件</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--background)]">
              <div className="aspect-square flex items-center justify-center bg-[var(--background-secondary)]">
                {item.content_type?.startsWith('image/') ? (
                  <img src={getUrl(item)} alt={item.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-3xl text-[var(--muted-foreground)]">📄</div>
                )}
              </div>
              <div className="p-2">
                <div className="text-xs text-[var(--foreground)] truncate">{item.filename}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">
                  {item.width && item.height ? `${item.width}×${item.height}` : ''}
                  {item.size ? ` · ${(item.size / 1024).toFixed(0)}KB` : ''}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (confirm('确认删除？')) { await deleteMedia(item.id); load(); }
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
