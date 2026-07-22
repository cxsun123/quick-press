'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import { uploadTheme, deleteTheme, activateTheme, deactivateTheme, listThemes } from '@/server/actions/theme.actions';
import { useTheme, BUILTIN_THEMES, type ThemeMode } from '@/hooks/use-theme';
import { FONT_OPTIONS, FONT_PREVIEW_ZH, FONT_PREVIEW_EN } from '@/lib/fonts';
import { Sun, Moon, Monitor, Upload, Trash2 } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

const MODE_OPTIONS: { id: ThemeMode; key: string; icon: typeof Sun }[] = [
  { id: 'light', key: 'light', icon: Sun },
  { id: 'dark', key: 'dark', icon: Moon },
  { id: 'system', key: 'system', icon: Monitor },
];

export default function ThemesPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const themeT = useTranslations('themes');
  const { mode, resolved, theme: currentTheme, setMode, setTheme, fontFamily, setFontFamily, bgImageUrl, bgOpacity, setBgImage, setBgOpacity, clearBgImage } = useTheme();
  const [uploaded, setUploaded] = useState<Theme[]>([]);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [bgUploading, setBgUploading] = useState(false);

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

  const handleBgUpload = async () => {
    const file = bgFileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert(tc('fileTooLarge'));
      if (bgFileRef.current) bgFileRef.current.value = '';
      return;
    }
    setBgUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      console.log('[Theme] upload response:', data);
      if (data.url) {
        setBgImage(data.url);
      } else {
        console.error('[Theme] no url in response:', data);
      }
    } catch (err) {
      console.error('[Theme] upload error:', err);
    }
    setBgUploading(false);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('themeManagement')}</h1>
        <a href="/" target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
          {t('previewSite')}
        </a>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('appearanceMode')}</h2>
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
                {t(opt.key)}
              </button>
            );
          })}
          <span className="ml-2 text-xs text-[var(--muted-foreground)]">
            {t('currentMode')}：<span className="font-medium text-[var(--foreground)]">{resolved === 'dark' ? t('dark') : t('light')}</span>
          </span>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('themeStyle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BUILTIN_THEMES.filter(th => th.id !== 'custom').map((th) => (
            <button key={th.id} onClick={() => { setTheme(th.id); deactivateTheme().catch(() => {}); }}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                currentTheme === th.id && !uploaded.some(u => u.is_active)
                  ? 'border-[var(--ring)] ring-2 ring-[var(--ring)] bg-[var(--accent)]'
                  : 'border-[var(--border)] hover:bg-[var(--accent)]'
              }`}>
              <div className="text-sm font-medium text-[var(--foreground)]">{themeT(th.id + 'Name')}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{themeT(th.id + 'Desc')}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('fontFamily')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_OPTIONS.map((fo) => {
            const active = fontFamily === fo.id;
            return (
              <button
                key={fo.id}
                onClick={() => setFontFamily(fo.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  active
                    ? 'border-[var(--ring)] ring-2 ring-[var(--ring)] bg-[var(--accent)]'
                    : 'border-[var(--border)] hover:bg-[var(--accent)]'
                }`}
              >
                <div className="text-sm font-medium text-[var(--foreground)] mb-1">{fo.name}</div>
                <div className="text-sm leading-relaxed" style={{ fontFamily: fo.fontBody }}>
                  <span className="text-[var(--foreground)]">{FONT_PREVIEW_ZH}</span>
                </div>
                <div className="text-xs leading-relaxed mt-0.5" style={{ fontFamily: fo.fontBody }}>
                  <span className="text-[var(--muted-foreground)]">{FONT_PREVIEW_EN}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('bgImage')}</h2>
        <div className="p-4 rounded-lg border border-[var(--border)]">
          <div className="flex gap-2 items-end mb-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('uploadBgImage')}</label>
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] cursor-pointer">
                <Upload className="h-4 w-4" />
                {bgFileRef.current?.files?.[0]?.name || tc('chooseFile')}
                <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              </label>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{t('bgImageLimit')}</p>
            </div>
            {bgUploading && <span className="text-xs text-[var(--muted-foreground)]">{tc('uploading')}</span>}
          </div>

          {bgImageUrl && (
            <>
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-[var(--border)] mb-3"
                style={{
                  backgroundImage: `url(${bgImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
                <div className="absolute inset-0" style={{ backgroundColor: 'var(--background)', opacity: 1 - bgOpacity / 100 }} />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">
                    {t('bgOpacity')}：{bgOpacity}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bgOpacity}
                    onChange={e => setBgOpacity(parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${bgOpacity}%, var(--border) ${bgOpacity}%, var(--border) 100%)`,
                      accentColor: 'var(--primary)',
                    }}
                  />
                </div>
                <div className="flex gap-1 text-xs text-[var(--muted-foreground)]">
                  <span className={bgOpacity === 0 ? 'font-medium text-[var(--foreground)]' : ''}>0%</span>
                  <span className={bgOpacity === 50 ? 'font-medium text-[var(--foreground)]' : ''}>50%</span>
                  <span className={bgOpacity === 100 ? 'font-medium text-[var(--foreground)]' : ''}>100%</span>
                </div>
              </div>

              <button onClick={clearBgImage}
                className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-red-500 text-white hover:bg-red-600">
                <Trash2 className="h-3 w-3" />
                {t('removeBgImage')}
              </button>
            </>
          )}

          {!bgImageUrl && (
            <p className="text-xs text-[var(--muted-foreground)]">{t('noBgImage')}</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('uploadCustomTheme')}</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('themeName')}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('cssFile')}</label>
            <label className="inline-block px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] cursor-pointer">
              {fileRef.current?.files?.[0]?.name || tc('chooseFile')}
              <input ref={fileRef} type="file" accept=".css" className="hidden" />
            </label>
          </div>
          <button onClick={handleUpload} disabled={uploading}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
            {uploading ? tc('uploading') : tc('upload')}
          </button>
        </div>
      </section>

      {uploaded.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('uploadedThemes')}</h2>
          <div className="space-y-2">
            {uploaded.map((u) => (
              <div key={u.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{u.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    await activateTheme(u.id);
                    setTheme('custom');
                    load();
                  }}
                    className={`px-3 py-1 text-xs rounded ${
                      u.is_active
                        ? 'bg-green-500 text-white'
                        : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                    }`}>
                    {u.is_active ? tc('inUse') : tc('enable')}
                  </button>
                  <button onClick={async () => {
                    if (confirm(tc('confirmDelete'))) { await deleteTheme(u.id); load(); }
                  }}
                    className="px-3 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600">
                    {tc('delete')}
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