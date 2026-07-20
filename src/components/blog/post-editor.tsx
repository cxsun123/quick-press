'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { WysiwygEditor } from '@chengxinsun26/editor';
import { savePost } from '@/server/actions/post.actions';
import { getTags, getCategories } from '@/server/actions/taxonomy.actions';
import { useRouter } from 'next/navigation';
import { MediaPicker } from '@/components/blog/media-picker';
import { EditorSidebar } from '@/components/blog/editor-sidebar';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import type { PostStatus, PostVisibility } from '@/models/post.model';

interface PostEditorProps {
  initialData?: {
    id?: string;
    title: string;
    content: string;
    excerpt?: string;
    status?: PostStatus;
    slug?: string;
    tag_ids?: string[];
    category_ids?: string[];
    summary?: string;
    keywords?: string[];
    visibility?: PostVisibility;
    password?: string;
    cover_image_url?: string;
  };
}

export function PostEditor({ initialData }: PostEditorProps) {
  const router = useRouter();
  const locale = useLocale();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tag_ids || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.category_ids || []);

  // New fields
  const [visibility, setVisibility] = useState<PostVisibility>(initialData?.visibility || 'public');
  const [password, setPassword] = useState(initialData?.password || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [extracting, setExtracting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [passwordSavedVersion, setPasswordSavedVersion] = useState(0);

  // Close right sidebar on mobile by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);
  const [postSlug, setPostSlug] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialData?.cover_image_url || null);

  // Sync coverImageUrl state when initialData updates (e.g. after save + refresh)
  useEffect(() => {
    if (initialData?.cover_image_url) {
      setCoverImageUrl(initialData.cover_image_url);
    }
  }, [initialData?.cover_image_url]);

  const savedRef = useRef(true);

  const contentImages = (() => {
    const urls: string[] = [];
    const regex = /!\[.*?\]\((.*?)\)/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      if (m[1].trim()) urls.push(m[1].trim());
    }
    return urls;
  })();

  useEffect(() => {
    getTags().then(setTags);
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    savedRef.current = false;
  }, [title, content, selectedTags, selectedCategories, visibility, password, summary, keywords]);

  const markSaved = useCallback(() => {
    savedRef.current = true;
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!savedRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleSave = useCallback(async (publish = false) => {
    setSaving(true);
    try {
      const form = new FormData();
      if (initialData?.id) form.set('id', initialData.id);
      form.set('title', title);
      form.set('content', content);
      form.set('status', publish ? 'published' : 'draft');
      form.set('tag_ids', JSON.stringify(selectedTags));
      form.set('category_ids', JSON.stringify(selectedCategories));
      form.set('visibility', visibility);
      if (password) form.set('password', password);
      form.set('summary', summary);
      form.set('keywords', JSON.stringify(keywords));
      form.set('cover_image_url', coverImageUrl || '');
      const result = await savePost(form);
      if (result?.slug) setPostSlug(result.slug);
      setStatus(publish ? 'published' : 'draft');
      setPasswordSavedVersion((v) => v + 1);
      markSaved();
      if (publish) {
        router.push('/admin/posts');
      } else {
        router.refresh();
      }
    } catch (e: any) {
      alert(e.message || '保存失败');
    }
    setSaving(false);
  }, [title, content, selectedTags, selectedCategories, initialData?.id, router, markSaved, visibility, password, summary, keywords, coverImageUrl]);

  const handleExtractSummary = useCallback(async () => {
    if (!content.trim()) {
      alert('请先输入文章内容');
      return;
    }
    setExtracting(true);
    try {
      const { extractSummary } = await import('@/server/actions/ai.actions');
      const result = await extractSummary(content);
      setSummary(result.summary);
      setKeywords(result.keywords);
    } catch (e: any) {
      alert(e.message || '提取失败');
    }
    setExtracting(false);
  }, [content]);

  const handleBack = useCallback(() => {
    if (!savedRef.current && !confirm('有未保存的修改，确定离开？')) return;
    router.push('/admin/posts');
  }, [router]);

  return (
    <div className="flex gap-0 relative">
      {/* Main editor area */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Top action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </button>
            <h1 className="text-lg font-semibold text-[var(--muted-foreground)]">
              {initialData?.id ? '编辑文章' : '新建文章'}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入文章标题"
            className="w-full px-4 py-3 text-2xl font-bold border-0 border-b border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 placeholder:italic focus:outline-none focus:border-[var(--ring)] transition-colors"
          />
        </div>

        <div className="max-w-4xl mx-auto">
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
                    title: '插入资源图片',
                    onClick: () => setShowMediaPicker(true),
                  },
                ]}
              />
            </div>
          </div>
        </div>

      {/* Right sidebar */}
      <div className="relative">
        <EditorSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          status={status}
          saving={saving}
          allowPublish={!!title.trim() && (visibility !== 'password' || password.trim().length >= 1)}
          onSave={handleSave}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          password={password}
          onPasswordChange={setPassword}
          categories={categories}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          tags={tags}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          summary={summary}
          onSummaryChange={setSummary}
          keywords={keywords}
          onKeywordsChange={setKeywords}
          onExtractSummary={handleExtractSummary}
          extracting={extracting}
          slug={postSlug || initialData?.slug}
          postId={initialData?.id}
          onTagsRefresh={() => getTags().then(setTags)}
          coverImageUrl={coverImageUrl}
          contentImages={contentImages}
          onCoverImageChange={setCoverImageUrl}
          showSource={showSource}
          onToggleSource={() => setShowSource(!showSource)}
          passwordSavedVersion={passwordSavedVersion}
          previewUrl={(postSlug || initialData?.slug) ? `/blog/${postSlug || initialData?.slug}?preview=true` : undefined}
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
    </div>
  );
}
