'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getSiteConfig, updateSiteConfig, testImageSearchUrls, type ImageSearchTestResult } from '@/server/actions/site-config.actions';
import { Eye, EyeOff } from 'lucide-react';
import { routing, localeNames, type Locale } from '@/i18n/routing';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('admin');
  const [siteTitle, setSiteTitle] = useState('');
  const [regMode, setRegMode] = useState('open');
  const [saving, setSaving] = useState(false);

  const [aiUrl, setAiUrl] = useState('');
  const [aiKey, setAiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiMaxContent, setAiMaxContent] = useState('100000');

  const [mcpKey, setMcpKey] = useState('');
  const [showMcpKey, setShowMcpKey] = useState(false);

  const [currentLocale, setCurrentLocale] = useState<string>(routing.defaultLocale);

  const [imageSearchUrls, setImageSearchUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [testingAll, setTestingAll] = useState(false);
  const [urlTestResults, setUrlTestResults] = useState<Map<string, ImageSearchTestResult>>(new Map());
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    (async () => {
      setSiteTitle((await getSiteConfig('site_title')) || 'quick-press');
      setRegMode((await getSiteConfig('registration_mode')) || 'open');
      setAiUrl((await getSiteConfig('ai_provider_url')) || '');
      setAiKey((await getSiteConfig('ai_api_key')) || '');
      setAiModel((await getSiteConfig('ai_model')) || 'gpt-4o-mini');
      setAiMaxContent((await getSiteConfig('ai_max_content_length')) || '100000');
      setMcpKey((await getSiteConfig('mcp_api_key')) || '');
      const raw = await getSiteConfig('image_search_url');
      if (raw) {
        setImageSearchUrls(raw.split(',').map((s: string) => s.trim()).filter(Boolean));
      }
    })();
    const cookie = document.cookie.split('; ').find(r => r.startsWith('NEXT_LOCALE='));
    if (cookie) {
      setCurrentLocale(cookie.split('=')[1]);
    }
  }, []);

  const normalizeUrl = (url: string) => url.replace(/\/+$/, '').trim();

  const handleAddUrl = async () => {
    const normalized = normalizeUrl(newImageUrl);
    if (!normalized || imageSearchUrls.includes(normalized)) return;
    setAddingUrl(true);
    setUrlError('');
    try {
      const results = await testImageSearchUrls([normalized]);
      const result = results[0];
      setUrlTestResults(prev => new Map(prev).set(normalized, result));
      if (result.ok) {
        const updated = [...imageSearchUrls, normalized];
        setImageSearchUrls(updated);
        setNewImageUrl('');
      } else {
        setUrlError(result.message);
      }
    } catch (e: any) {
      setUrlError(e?.message || '网络请求失败');
    }
    setAddingUrl(false);
  };

  const handleRemoveUrl = (url: string) => {
    setImageSearchUrls(prev => prev.filter(u => u !== url));
    setUrlTestResults(prev => { const m = new Map(prev); m.delete(url); return m; });
  };

  const handleTestAll = async () => {
    if (!imageSearchUrls.length) return;
    setTestingAll(true);
    setUrlError('');
    try {
      const results = await testImageSearchUrls(imageSearchUrls);
      const m = new Map<string, ImageSearchTestResult>();
      for (const r of results) m.set(r.url, r);
      setUrlTestResults(m);
    } catch (e: any) {
      setUrlError(e?.message || '测试请求失败');
    }
    setTestingAll(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteConfig('site_title', siteTitle);
      await updateSiteConfig('registration_mode', regMode);
      await updateSiteConfig('ai_provider_url', aiUrl);
      if (aiKey) await updateSiteConfig('ai_api_key', aiKey);
      await updateSiteConfig('ai_model', aiModel);
      await updateSiteConfig('ai_max_content_length', aiMaxContent);
      if (mcpKey) await updateSiteConfig('mcp_api_key', mcpKey);
      await updateSiteConfig('image_search_url', imageSearchUrls.join(', '));
      await updateSiteConfig('locale', currentLocale);
      window.location.reload();
      return;
    } catch {}
    setSaving(false);
  };

  const handleGenerateMcpKey = () => {
    const key = 'sk-mcp-' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setMcpKey(key);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">{t('systemSettings')}</h1>

      <div className="max-w-lg space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('siteInfo')}</h2>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('siteTitle')}</label>
            <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]" />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('registrationSettings')}</h2>
          <select value={regMode} onChange={(e) => setRegMode(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]">
            <option value="open">{t('openRegistration')}</option>
            <option value="invite">{t('inviteRegistration')}</option>
            <option value="closed">{t('closedRegistration')}</option>
          </select>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('aiConfig')}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('aiProviderUrl')}</label>
              <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('aiApiKey')}</label>
              <div className="relative">
                <input type={showAiKey ? 'text' : 'password'} value={aiKey}
                  onChange={(e) => setAiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] pr-10" />
                <button type="button" onClick={() => setShowAiKey(!showAiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  {showAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('aiModel')}</label>
              <input value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">{t('aiContentTruncation')}</label>
              <input type="number" value={aiMaxContent} onChange={(e) => setAiMaxContent(e.target.value)}
                placeholder="100000"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{t('aiTruncationHint')}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('mcpConfig')}</h2>
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              {t('mcpHint')}
            </p>
            <div className="flex gap-2">
              {mcpKey ? (
                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <input type={showMcpKey ? 'text' : 'password'} value={mcpKey} readOnly
                      className="w-full px-3 py-2 text-sm font-mono border border-[var(--border)] rounded-lg bg-[var(--background-secondary)] text-[var(--foreground)] pr-10" />
                    <button type="button" onClick={() => setShowMcpKey(!showMcpKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      {showMcpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { navigator.clipboard.writeText(mcpKey); }}
                      className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors">
                      {t('mcpCopy')}
                    </button>
                    <button type="button" onClick={handleGenerateMcpKey}
                      className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                      {t('mcpRegenerate')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={handleGenerateMcpKey}
                  className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
                  {t('mcpGenerate')}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Image Search */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('imageSearchConfig')}</h2>
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted-foreground)]">{t('imageSearchHint')}</p>
            <div className="flex gap-2">
              <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                placeholder={t('imageSearchPlaceholder')}
                disabled={addingUrl}
                className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
              <button type="button" onClick={handleAddUrl} disabled={addingUrl || !newImageUrl.trim()}
                className="px-3 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap">
                {addingUrl ? t('imageSearchTesting') : t('imageSearchAdd')}
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)]">{t('imageSearchSaveHint')}</p>
            {urlError && (
              <p className="text-xs text-red-500">{urlError}</p>
            )}
            {imageSearchUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageSearchUrls.map((url) => {
                  const result = urlTestResults.get(url);
                  const isOk = result?.ok;
                  const isError = result && !result.ok;
                  return (
                    <div key={url}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isOk ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300'
                        : isError ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]'
                      }`}>
                      <span className="max-w-[260px] truncate">{url}</span>
                      {isOk && result.latencyMs > 0 && (
                        <span className="text-[10px] opacity-70 ml-0.5">{result.latencyMs}ms</span>
                      )}
                      {isError && (
                        <span className="text-[10px] opacity-70 ml-0.5">{result.status || '!'}</span>
                      )}
                      <button type="button" onClick={() => handleRemoveUrl(url)}
                        className="ml-0.5 hover:opacity-60 transition-opacity">&times;</button>
                    </div>
                  );
                })}
              </div>
            )}
            {imageSearchUrls.length > 0 && (
              <button type="button" onClick={handleTestAll} disabled={testingAll}
                className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors">
                {testingAll ? t('imageSearchTesting') : t('imageSearchTestAll')}
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('language')}</h2>
          <select
            value={currentLocale}
            onChange={(e) => {
              setCurrentLocale(e.target.value);
              document.cookie = `NEXT_LOCALE=${e.target.value}; path=/; max-age=31536000`;
              router.refresh();
            }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm"
          >
            {routing.locales.map((l) => (
              <option key={l} value={l}>{localeNames[l]}</option>
            ))}
          </select>
        </section>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
          {saving ? t('saving') : t('saveSettings')}
        </button>
      </div>
    </AdminLayout>
  );
}
