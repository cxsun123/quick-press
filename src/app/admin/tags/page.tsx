'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  getTags, createTag, deleteTag,
  getCategories, createCategory, deleteCategory,
} from '@/server/actions/taxonomy.actions';
import { TagColorPicker } from '@/components/admin/tag-color-picker';

interface Tag { id: string; name: string; slug: string; color: string; }
interface Category { id: string; name: string; slug: string; parent_id: string | null; }

export default function TagsPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<'tags' | 'categories'>('tags');
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3B82F6');
  const [catName, setCatName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setTags(await getTags());
    setCategories(await getCategories());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    form.set('name', tagName);
    form.set('color', tagColor);
    const res = await createTag(form);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setTagName('');
      await load();
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`${tc('confirmDelete')}「${name}」？`)) return;
    setError('');
    const res = await deleteTag(id);
    if (res.error) {
      setError(res.error);
    } else {
      await load();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    form.set('name', catName);
    const res = await createCategory(form);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setCatName('');
      await load();
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`${tc('confirmDelete')}「${name}」？`)) return;
    setError('');
    const res = await deleteCategory(id);
    if (res.error) {
      setError(res.error);
    } else {
      await load();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">{t('tagManagement')}</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => { setTab('tags'); setError(''); }}
          className={`px-4 py-2 text-sm rounded-lg ${tab === 'tags' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border border-[var(--border)] text-[var(--foreground)]'}`}>
          {t('tags')}
        </button>
        <button onClick={() => { setTab('categories'); setError(''); }}
          className={`px-4 py-2 text-sm rounded-lg ${tab === 'categories' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border border-[var(--border)] text-[var(--foreground)]'}`}>
          {t('categories')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {tab === 'tags' && (
        <div>
          <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
            <input name="name" placeholder={tc('add') + ' ' + tc('tag')} required value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]" />
            <TagColorPicker value={tagColor} onChange={setTagColor} />
            <button type="submit" disabled={busy}
              className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50">
              {busy ? tc('adding') : tc('add')}
            </button>
          </form>
          {tags.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">{tc('noTags')}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                  {tag.name}
                  <button onClick={() => handleDeleteTag(tag.id, tag.name)}
                  title={tc('delete')}
                  className="text-xs hover:opacity-70 ml-1">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div>
          <form onSubmit={handleCreateCategory} className="flex gap-2 mb-4">
            <input name="name" placeholder={tc('add') + ' ' + tc('category')} required value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]" />
            <button type="submit" disabled={busy}
              className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50">
              {busy ? tc('adding') : tc('add')}
            </button>
          </form>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">{tc('noCategories')}</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id}
                  className="flex items-center justify-between px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <span className="text-[var(--foreground)]">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">
                    {tc('delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
