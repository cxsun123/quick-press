'use client';

interface SummaryPanelProps {
  summary: string;
  onSummaryChange: (s: string) => void;
  keywords: string[];
  onKeywordsChange: (k: string[]) => void;
  onExtract: () => void;
  extracting: boolean;
}

export function SummaryPanel({ summary, onSummaryChange, keywords, onKeywordsChange, onExtract, extracting }: SummaryPanelProps) {
  const handleKeywordRemove = (index: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== index));
  };

  const handleKeywordAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (val && !keywords.includes(val)) {
        onKeywordsChange([...keywords, val]);
      }
      (e.target as HTMLInputElement).value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--muted-foreground)]">摘要</span>
        <button
          type="button"
          onClick={onExtract}
          disabled={extracting}
          className="px-2 py-0.5 text-xs rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
        >
          {extracting ? '提取中...' : '提取摘要'}
        </button>
      </div>
      <textarea
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        placeholder="文章摘要（50字以内）"
        rows={3}
        className="w-full px-2 py-1.5 text-sm rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] resize-none"
      />
      <div className="mt-2">
        <div className="text-xs text-[var(--muted-foreground)] mb-1">关键字</div>
        <div className="flex flex-wrap gap-1 mb-1">
          {keywords.map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-[var(--primary)]/10 text-[var(--foreground)]"
            >
              {kw}
              <button
                type="button"
                onClick={() => handleKeywordRemove(i)}
                className="text-[var(--muted-foreground)] hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="输入关键字后按 Enter 或逗号添加"
          onKeyDown={handleKeywordAdd}
          className="w-full px-2 py-1 text-xs rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
        />
      </div>
    </div>
  );
}
