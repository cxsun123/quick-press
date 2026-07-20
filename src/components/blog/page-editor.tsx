'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { WysiwygEditor } from '@chengxinsun26/editor';
import { createPage, updatePage } from '@/server/actions/page.actions';
import { useRouter } from 'next/navigation';
import { MediaPicker } from '@/components/blog/media-picker';
import { CodeSquare, ImagePlus } from 'lucide-react';

interface PageEditorProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: string;
  };
  onDone?: () => void;
}

export function PageEditor({ initialData, onDone }: PageEditorProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('post');
  const ta = useTranslations('admin');
  const tc = useTranslations('common');
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const handleSave = useCallback(async (publish = false) => {
    setSaving(true);
    try {
      const form = new FormData();
      form.set('title', title);
      form.set('slug', slug || title.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '') || 'page');
      form.set('content', content);
      form.set('status', publish ? 'published' : 'draft');

      if (initialData?.id) {
        const result = await updatePage(initialData.id, form);
        if (result.error) { alert(result.error); setSaving(false); return; }
      } else {
        const result = await createPage(form);
        if (result.error) { alert(result.error); setSaving(false); return; }
      }
      setStatus(publish ? 'published' : 'draft');
      router.refresh();
      onDone?.();
    } catch (e: any) {
      alert(e.message || tc('loading'));
    }
    setSaving(false);
  }, [title, slug, content, initialData?.id, router, onDone, tc]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--foreground)]">
        {initialData?.id ? ta('editPage') : ta('newPage')}
      </h2>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">{t('pageTitlePlaceholder')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('pageTitlePlaceholder')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">{t('slugAuto')}</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="page-slug"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSource(!showSource)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            showSource
              ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
          }`}
          title={showSource ? t('sourceEditor') : t('toggleSource')}
        >
          <CodeSquare className="h-4 w-4" />
          {showSource ? t('sourceEditor') : t('toggleSource')}
        </button>
      </div>

      <div className="min-h-[500px] border border-[var(--border)] rounded-lg overflow-hidden">
        <WysiwygEditor
          content={content}
          onChange={setContent}
          showSource={showSource}
          onToggleSource={() => setShowSource(!showSource)}
          locale={locale as 'en' | 'zh'}
          customTools={[
            {
              id: 'insert-media',
              icon: <ImagePlus className="h-4 w-4" />,
              title: t('insertMedia'),
              onClick: () => setShowMediaPicker(true),
            },
          ]}
        />
      </div>

      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          const ed = (window as any).__tiptapEditor;
          if (ed) ed.chain().focus().setImage({ src: url }).run();
          setShowMediaPicker(false);
        }}
      />

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <div className="text-sm text-[var(--muted-foreground)]">
          {status === 'published' ? tc('published') : tc('draft')}
        </div>
        <div className="flex items-center gap-2">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              {tc('cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
          >
            {saving ? tc('saving') : t('saveDraft')}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {tc('publish')}
          </button>
        </div>
      </div>
    </div>
  );
}
