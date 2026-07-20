'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import { PageEditor } from '@/components/blog/page-editor';
import { deletePage, getPages } from '@/server/actions/page.actions';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  parent_id: string | null;
  template: string;
}

export default function PagesPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const [pages, setPages] = useState<Page[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setPages(await getPages());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm(tc('confirmDelete'))) return;
    const result = await deletePage(id);
    if (result.error) { alert(result.error); return; }
    load();
  };

  const editingPage = editingId ? pages.find(p => p.id === editingId) : null;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('pageManagement')}</h1>
        {!showNew && !editingId && (
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            {t('newPage')}
          </button>
        )}
      </div>

      {showNew && (
        <div className="mb-8 border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
          <PageEditor onDone={() => { setShowNew(false); load(); }} />
        </div>
      )}

      {editingId && editingPage && (
        <div className="mb-8 border border-[var(--border)] rounded-lg p-4 bg-[var(--background)]">
          <PageEditor
            initialData={editingPage}
            onDone={() => { setEditingId(null); load(); }}
          />
        </div>
      )}

      {!showNew && !editingId && (
        <div className="space-y-2">
          {pages.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)]">{tc('noPages')}</div>
          ) : (
            pages.map((page) => (
              <div key={page.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div>
                  <div className="font-medium text-[var(--foreground)]">{page.title}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">/{page.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {page.status === 'published' ? tc('published') : tc('draft')}
                  </span>
                  <button onClick={() => setEditingId(page.id)}
                    className="px-3 py-1 text-xs rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
                    {tc('edit')}
                  </button>
                  <button onClick={() => handleDelete(page.id)}
                    className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">
                    {tc('delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}
