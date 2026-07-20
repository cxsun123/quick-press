'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, Search, X, CodeSquare } from 'lucide-react';
import { TagColorPicker } from '@/components/admin/tag-color-picker';
import type { PostStatus, PostVisibility } from '@/models/post.model';
import { VisibilityPanel } from '@/components/blog/visibility-panel';
import { SummaryPanel } from '@/components/blog/summary-panel';
import { CoverPicker } from '@/components/blog/cover-picker';
import { createTag } from '@/server/actions/taxonomy.actions';

interface EditorSidebarProps {
  open: boolean;
  onToggle: () => void;
  status: PostStatus;
  saving: boolean;
  allowPublish: boolean;
  onSave: (publish: boolean) => void;
  visibility: PostVisibility;
  onVisibilityChange: (v: PostVisibility) => void;
  password: string;
  onPasswordChange: (p: string) => void;
  categories: { id: string; name: string }[];
  selectedCategories: string[];
  onCategoriesChange: (ids: string[]) => void;
  tags: { id: string; name: string; color: string }[];
  selectedTags: string[];
  onTagsChange: (ids: string[]) => void;
  summary: string;
  onSummaryChange: (s: string) => void;
  keywords: string[];
  onKeywordsChange: (k: string[]) => void;
  onExtractSummary: () => void;
  extracting: boolean;
  slug?: string;
  postId?: string;
  onTagsRefresh?: () => void;
  coverImageUrl?: string | null;
  contentImages?: string[];
  onCoverImageChange?: (url: string | null) => void;
  passwordSavedVersion?: number;
  showSource?: boolean;
  onToggleSource?: () => void;
  previewUrl?: string;
}

export function EditorSidebar({
  open,
  onToggle,
  status,
  saving,
  allowPublish,
  onSave,
  visibility,
  onVisibilityChange,
  password,
  onPasswordChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  tags,
  selectedTags,
  onTagsChange,
  summary,
  onSummaryChange,
  keywords,
  onKeywordsChange,
  onExtractSummary,
  extracting,
  slug,
  postId,
  coverImageUrl,
  contentImages,
  onCoverImageChange,
  onTagsRefresh,
  showSource,
  onToggleSource,
  passwordSavedVersion,
  previewUrl,
}: EditorSidebarProps) {
  const [tagSearch, setTagSearch] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [addingTag, setAddingTag] = useState(false);

  const filteredTags = tagSearch
    ? tags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : tags;

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setAddingTag(true);
    try {
      const form = new FormData();
      form.set('name', name);
      form.set('color', newTagColor);
      const result = await createTag(form);
      if (result?.error) {
        alert(result.error);
      } else {
        setNewTagName('');
        setTagSearch('');
        onTagsRefresh?.();
      }
    } catch (e: any) {
      alert(e.message || '创建标签失败');
    }
    setAddingTag(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <>
      {open && (
        <aside className="w-[280px] shrink-0 border-l border-[var(--border)] bg-[var(--background)] overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Publish Panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--muted-foreground)]">发布状态</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  status === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onSave(false)}
                  disabled={saving}
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
                >
                  {saving ? '保存中...' : '保存草稿'}
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSave(true)}
                    disabled={saving || !allowPublish}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    发布
                  </button>
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[80px] shrink-0 px-3 py-2 text-sm rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors text-center"
                    >
                      预览
                    </a>
                  ) : (
                    <span className="w-[80px] shrink-0 px-3 py-2 text-sm rounded-md border border-[var(--border)] text-[var(--muted-foreground)] text-center opacity-50 cursor-not-allowed">
                      预览
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Editor actions */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={onToggleSource}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                  showSource
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <CodeSquare className="h-4 w-4" />
                {showSource ? '关闭源码' : '源码编辑'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Cover Image */}
            <CoverPicker
              coverImageUrl={coverImageUrl ?? null}
              contentImages={contentImages ?? []}
              onChange={(url) => onCoverImageChange?.(url)}
            />

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Visibility Panel */}
            <VisibilityPanel
              visibility={visibility}
              onChange={onVisibilityChange}
              password={password}
              onPasswordChange={onPasswordChange}
              slug={slug}
              postId={postId}
              passwordSavedVersion={passwordSavedVersion}
            />

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Categories Panel */}
            <div>
              <div className="text-xs text-[var(--muted-foreground)] mb-2">分类</div>
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        onCategoriesChange(
                          active
                            ? selectedCategories.filter((id) => id !== cat.id)
                            : [...selectedCategories, cat.id],
                        )
                      }
                      className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                        active
                          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Tags Panel */}
            <div>
              <div className="text-xs text-[var(--muted-foreground)] mb-2">标签</div>

              {/* Tag search filter */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="搜索标签..."
                  className="w-full pl-7 pr-6 py-1 text-xs rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
                {tagSearch && (
                  <button
                    type="button"
                    onClick={() => setTagSearch('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Tag list */}
              <div className="flex flex-wrap gap-1 mb-2 max-h-[160px] overflow-y-auto">
                {filteredTags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        onTagsChange(
                          active
                            ? selectedTags.filter((id) => id !== tag.id)
                            : [...selectedTags, tag.id],
                        )
                      }
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity ${
                        active
                          ? 'text-white border-transparent'
                          : 'hover:opacity-80'
                      }`}
                      style={active ? { backgroundColor: tag.color } : { borderColor: tag.color, color: tag.color }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {filteredTags.length === 0 && (
                  <span className="text-xs text-[var(--muted-foreground)]">无匹配标签</span>
                )}
              </div>

              {/* Add new tag */}
              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="新标签名"
                  className="flex-1 min-w-0 px-2 py-1 text-xs rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
                <TagColorPicker value={newTagColor} onChange={setNewTagColor} />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={addingTag || !newTagName.trim()}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  新增
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Summary Panel */}
            <SummaryPanel
              summary={summary}
              onSummaryChange={onSummaryChange}
              keywords={keywords}
              onKeywordsChange={onKeywordsChange}
              onExtract={onExtractSummary}
              extracting={extracting}
            />
          </div>
        </aside>
      )}
      {/* Toggle button when sidebar is collapsed */}
      {!open && (
        <button
          type="button"
          onClick={onToggle}
          className="self-start mt-4 p-1.5 rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          title="打开右侧面板"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {/* Toggle button when sidebar is open */}
      {open && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute -left-3 top-4 p-0.5 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors z-10"
          title="关闭右侧面板"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </>
  );
}
