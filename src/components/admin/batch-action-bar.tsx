'use client';

interface BatchActionBarProps {
  selectedCount: number;
  onSetVisibility: (visibility: 'public' | 'private') => void;
  onClear: () => void;
}

export function BatchActionBar({ selectedCount, onSetVisibility, onClear }: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg pointer-events-auto">
        <span className="text-sm text-[var(--foreground)] whitespace-nowrap">
          已选择 <strong>{selectedCount}</strong> 篇文章
        </span>
        <div className="w-px h-5 bg-[var(--border)]" />
        <button
          type="button"
          onClick={() => onSetVisibility('public')}
          className="px-3 py-1.5 text-xs rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          批量设为公开
        </button>
        <button
          type="button"
          onClick={() => onSetVisibility('private')}
          className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          批量设为私密
        </button>
        <div className="w-px h-5 bg-[var(--border)]" />
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-1.5 text-xs rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          取消选择
        </button>
      </div>
    </div>
  );
}
