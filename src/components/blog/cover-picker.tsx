'use client';

import { useState } from 'react';
import { Image, X } from 'lucide-react';

interface CoverPickerProps {
  coverImageUrl: string | null;
  contentImages: string[];
  onChange: (url: string | null) => void;
}

export function CoverPicker({ coverImageUrl, contentImages, onChange }: CoverPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="text-xs text-[var(--muted-foreground)] mb-2">封面图</div>
      <div className="flex items-center gap-2">
        {coverImageUrl ? (
          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-[var(--border)] shrink-0">
            <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-md border border-dashed border-[var(--border)] flex items-center justify-center shrink-0 bg-[var(--background-secondary)]">
            <Image className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
        )}
        {contentImages.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-2 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            从内容选择
          </button>
        )}
      </div>

      {/* Image selector modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-[var(--background)] rounded-lg border border-[var(--border)] shadow-xl p-4 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--foreground)]">选择封面图</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {contentImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { onChange(url); setOpen(false); }}
                  className={`relative aspect-video rounded-md overflow-hidden border-2 transition-colors ${
                    coverImageUrl === url ? 'border-[var(--primary)]' : 'border-transparent hover:border-[var(--border)]'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">共 {contentImages.length} 张图片，点击选择</p>
          </div>
        </div>
      )}
    </div>
  );
}
