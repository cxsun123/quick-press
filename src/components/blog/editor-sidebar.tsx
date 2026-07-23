'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, ChevronLeft, Plus, Search, X, CodeSquare } from 'lucide-react';
import { TagColorPicker } from '@/components/admin/tag-color-picker';
import type { PostStatus, PostVisibility } from '@/models/post.model';
import { VisibilityPanel } from '@/components/blog/visibility-panel';
import { SummaryPanel } from '@/components/blog/summary-panel';
import { CoverPicker } from '@/components/blog/cover-picker';
import { createTag, createCategory } from '@/server/actions/taxonomy.actions';
import type { CategoryTreeNode } from '@/models/category.model';

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
  coverImageUrl?: string | null;
  contentImages?: string[];
  onCoverImageChange?: (url: string | null) => void;
  passwordSavedVersion?: number;
  showSource?: boolean;
  onToggleSource?: () => void;
  previewUrl?: string;
  onTagsRefresh?: () => void;
  onCategoriesRefresh?: () => void;
}

function flattenTree(nodes: CategoryTreeNode[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth });
    if (node.children.length) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
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
  showSource,
  onToggleSource,
  passwordSavedVersion,
  previewUrl,
  onTagsRefresh,
  onCategoriesRefresh,
}: EditorSidebarProps) {
  const t = useTranslations('post');
  const tc = useTranslations('common');
  const [tagSearch, setTagSearch] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [addingTag, setAddingTag] = useState(false);

  const [catSearch, setCatSearch] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);

  const filteredTags = tagSearch
    ? tags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : tags;

  const filteredCategories = catSearch
    ? categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  const loadTree = async () => {
    const { getCategoriesTree } = await import('@/server/actions/taxonomy.actions');
    setCategoryTree(await getCategoriesTree());
  };

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
        if (result?.id) {
          onTagsChange([...selectedTags, result.id]);
        }
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create tag');
    }
    setAddingTag(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const form = new FormData();
      form.set('name', name);
      if (newCatParentId) form.set('parent_id', newCatParentId);
      const result = await createCategory(form);
      if (result?.error) {
        alert(result.error);
      } else {
        setNewCatName('');
        setNewCatParentId('');
        setCatSearch('');
        setShowAddCat(false);
        onCategoriesRefresh?.();
        loadTree();
        if (result?.id) {
          onCategoriesChange([...selectedCategories, result.id]);
        }
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create category');
    }
    setAddingCat(false);
  };

  const handleCatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const flatParentOptions = flattenTree(categoryTree);

  return (
    <>
      {open && (
        <aside className="w-[280px] shrink-0 border-l border-[var(--border)] bg-[var(--background)] overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Publish Panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--muted-foreground)]">{t('status')}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  status === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {status === 'published' ? tc('published') : tc('draft')}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onSave(false)}
                  disabled={saving}
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
                >
                  {saving ? tc('saving') : t('saveDraft')}
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSave(true)}
                    disabled={saving || !allowPublish}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {tc('publish')}
                  </button>
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-[80px] shrink-0 px-3 py-2 text-sm rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors text-center"
                    >
                      {tc('preview')}
                    </a>
                  ) : (
                    <span className="w-[80px] shrink-0 px-3 py-2 text-sm rounded-md border border-[var(--border)] text-[var(--muted-foreground)] text-center opacity-50 cursor-not-allowed">
                      {tc('preview')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)]" />

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
                {showSource ? t('sourceEditor') : t('toggleSource')}
              </button>
            </div>

            <div className="border-t border-[var(--border)]" />

            <CoverPicker
              coverImageUrl={coverImageUrl ?? null}
              contentImages={contentImages ?? []}
              onChange={(url) => onCoverImageChange?.(url)}
            />

            <div className="border-t border-[var(--border)]" />

            <VisibilityPanel
              visibility={visibility}
              onChange={onVisibilityChange}
              password={password}
              onPasswordChange={onPasswordChange}
              slug={slug}
              postId={postId}
              passwordSavedVersion={passwordSavedVersion}
            />

            <div className="border-t border-[var(--border)]" />

            {/* Categories - WordPress style */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--muted-foreground)]">{t('categories')}</span>
                <button
                  type="button"
                  onClick={() => { setShowAddCat(!showAddCat); if (!showAddCat) loadTree(); }}
                  className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" />
                  {t('newCategory')}
                </button>
              </div>

              {showAddCat && (
                <div className="mb-2 p-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 space-y-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={handleCatKeyDown}
                    placeholder={t('newCategoryNamePlaceholder')}
                    className="w-full px-2 py-1 text-xs rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
                  />
                  <select
                    value={newCatParentId}
                    onChange={(e) => setNewCatParentId(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                  >
                    <option value="">{t('topCategory')}</option>
                    {flatParentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {'\u00A0\u00A0'.repeat(opt.depth)}{opt.depth > 0 ? '└ ' : ''}{opt.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={addingCat || !newCatName.trim()}
                      className="flex-1 px-2 py-1 text-xs rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {addingCat ? tc('adding') : tc('add')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCat(false); setNewCatName(''); setNewCatParentId(''); }}
                      className="px-2 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                    >
                      {tc('cancel')}
                    </button>
                  </div>
                </div>
              )}

              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder={t('categoryPlaceholder')}
                  className="w-full pl-7 pr-6 py-1 text-xs rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
                {catSearch && (
                  <button
                    type="button"
                    onClick={() => setCatSearch('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                {filteredCategories.map((cat) => {
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
                {filteredCategories.length === 0 && (
                  <span className="text-xs text-[var(--muted-foreground)]">{t('noMatchCategories')}</span>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--border)]" />

            {/* Tags */}
            <div>
              <div className="text-xs text-[var(--muted-foreground)] mb-2">{t('tags')}</div>

              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder={t('tagPlaceholder')}
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
                  <span className="text-xs text-[var(--muted-foreground)]">{t('noMatchTags')}</span>
                )}
              </div>

              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={t('newTagNamePlaceholder')}
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
                  {t('newTag')}
                </button>
              </div>
            </div>

            <div className="border-t border-[var(--border)]" />

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
      {!open && (
        <button
          type="button"
          onClick={onToggle}
          className="self-start mt-4 p-1.5 rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          title={t('toggleSource')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {open && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute -left-3 top-4 p-0.5 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors z-10"
          title={t('toggleSource')}
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </>
  );
}
