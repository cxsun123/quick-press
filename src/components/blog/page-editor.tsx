'use client';

import { useState, useCallback } from 'react';
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
      alert(e.message || '保存失败');
    }
    setSaving(false);
  }, [title, slug, content, initialData?.id, router, onDone]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--foreground)]">
        {initialData?.id ? '编辑页面' : '新建页面'}
      </h2>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">页面标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="页面标题"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Slug（留空自动生成）</label>
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
          title={showSource ? '关闭源码编辑' : '打开源码编辑'}
        >
          <CodeSquare className="h-4 w-4" />
          {showSource ? '关闭源码' : '源码编辑'}
        </button>
      </div>

      <div className="min-h-[500px] border border-[var(--border)] rounded-lg overflow-hidden">
        <WysiwygEditor
          content={content}
          onChange={setContent}
          showSource={showSource}
          onToggleSource={() => setShowSource(!showSource)}
          customTools={[
            {
              id: 'insert-media',
              icon: <ImagePlus className="h-4 w-4" />,
              title: '插入资源图片',
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
          {status === 'published' ? '已发布' : '草稿'}
        </div>
        <div className="flex items-center gap-2">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              取消
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存草稿'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            发布
          </button>
        </div>
      </div>
    </div>
  );
}
