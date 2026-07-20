'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { listMedia } from '@/server/actions/media.actions';

interface MediaItem {
  id: string;
  filename: string;
  storage_path: string;
  content_type: string;
  width: number | null;
  height: number | null;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const tc = useTranslations('common');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tab, setTab] = useState<'picker' | 'upload'>('picker');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => { setItems(await listMedia()); }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) { onSelect(data.url); onClose(); }
    } catch { /* ignore */ }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const getUrl = (item: MediaItem) => {
    const supabase = createClient();
    return supabase.storage.from('media').getPublicUrl(item.storage_path).data.publicUrl;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex gap-3">
            <button onClick={() => setTab('picker')}
              className={`text-sm ${tab === 'picker' ? 'text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)]'}`}>
              {tc('mediaLibrary')}
            </button>
            <button onClick={() => setTab('upload')}
              className={`text-sm ${tab === 'upload' ? 'text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)]'}`}>
              {tc('upload')}
            </button>
          </div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'upload' ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-lg p-12 cursor-pointer hover:bg-[var(--accent)] transition-colors">
              <div className="text-4xl mb-2">📁</div>
              <div className="text-sm text-[var(--muted-foreground)]">
                {uploading ? tc('uploading') : tc('upload')}
              </div>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item) => (
                <button key={item.id} onClick={() => onSelect(getUrl(item))}
                  className="group relative aspect-square rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--background-secondary)] hover:ring-2 hover:ring-[var(--ring)] transition-all">
                  <img src={getUrl(item)} alt={item.filename} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <div className="text-[10px] text-white truncate">{item.filename}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
