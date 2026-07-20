'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { uploadTheme, deleteTheme, activateTheme, deactivateTheme, listThemes } from '@/server/actions/theme.actions';
import { useTheme, BUILTIN_THEMES, type ThemeMode } from '@/hooks/use-theme';
import { Sun, Moon, Monitor } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: '亮色', icon: Sun },
  { id: 'dark', label: '暗色', icon: Moon },
  { id: 'system', label: '跟随系统', icon: Monitor },
];

export default function ThemesPage() {
  const { mode, resolved, theme: currentTheme, setMode, setTheme } = useTheme();
  const [uploaded, setUploaded] = useState<Theme[]>([]);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => { setUploaded(await listThemes()); }, []);
  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!name || !file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set('name', name);
      form.set('file', file);
      await uploadTheme(form);
      setName('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err: any) { alert(err.message); }
    setUploading(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">主题管理</h1>

      {/* Light / Dark Mode */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">外观模式</h2>
        <div className="flex gap-2 items-center">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                  active
                    ? 'border-[var(--ring)] ring-2 ring-[var(--ring)] bg-[var(--accent)] text-[var(--foreground)]'
                    : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--accent)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
          <span className="ml-2 text-xs text-[var(--muted-foreground)]">
            当前：<span className="font-medium text-[var(--foreground)]">{resolved === 'dark' ? '暗色' : '亮色'}</span>
          </span>
        </div>
      </section>

      {/* Built-in themes */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">内置主题</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BUILTIN_THEMES.filter(t => t.id !== 'custom').map((t) => (
            <button key={t.id} onClick={() => { setTheme(t.id); deactivateTheme().catch(() => {}); }}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                currentTheme === t.id && !uploaded.some(u => u.is_active)
                  ? 'border-[var(--ring)] ring-2 ring-[var(--ring)] bg-[var(--accent)]'
                  : 'border-[var(--border)] hover:bg-[var(--accent)]'
              }`}>
              <div className="text-sm font-medium text-[var(--foreground)]">{t.name}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Upload new theme */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">上传自定义主题</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">主题名称</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">CSS 文件</label>
            <input ref={fileRef} type="file" accept=".css"
              className="w-full text-sm text-[var(--foreground)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90" />
          </div>
          <button onClick={handleUpload} disabled={uploading}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
      </section>

      {/* Uploaded themes */}
      {uploaded.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">已上传主题</h2>
          <div className="space-y-2">
            {uploaded.map((t) => (
              <div key={t.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{t.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {new Date(t.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    await activateTheme(t.id);
                    setTheme('custom');
                    load();
                  }}
                    className={`px-3 py-1 text-xs rounded ${
                      t.is_active
                        ? 'bg-green-500 text-white'
                        : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                    }`}>
                    {t.is_active ? '使用中' : '启用'}
                  </button>
                  <button onClick={async () => {
                    if (confirm('删除此主题？')) { await deleteTheme(t.id); load(); }
                  }}
                    className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
