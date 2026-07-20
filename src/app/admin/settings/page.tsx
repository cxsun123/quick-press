'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getSiteConfig, updateSiteConfig } from '@/server/actions/site-config.actions';
import { useTheme, BUILTIN_THEMES, type ThemeVars, type ThemeMode } from '@/hooks/use-theme';
import { Sun, Moon, Monitor, Eye, EyeOff } from 'lucide-react';

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: '亮色', icon: Sun },
  { id: 'dark', label: '暗色', icon: Moon },
  { id: 'system', label: '跟随系统', icon: Monitor },
];

export default function SettingsPage() {
  const { mode, resolved, theme, setMode, setTheme, customVars, setCustomVars, resetCustom } = useTheme();
  const [siteTitle, setSiteTitle] = useState('');
  const [regMode, setRegMode] = useState('open');
  const [saving, setSaving] = useState(false);
  const [localVars, setLocalVars] = useState<ThemeVars>(customVars);

  // AI config
  const [aiUrl, setAiUrl] = useState('');
  const [aiKey, setAiKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [showAiKey, setShowAiKey] = useState(false);
  const [aiMaxContent, setAiMaxContent] = useState('100000');

  // MCP config
  const [mcpKey, setMcpKey] = useState('');
  const [showMcpKey, setShowMcpKey] = useState(false);

  useEffect(() => {
    (async () => {
      setSiteTitle((await getSiteConfig('site_title')) || 'i_blog');
      setRegMode((await getSiteConfig('registration_mode')) || 'open');
      setAiUrl((await getSiteConfig('ai_provider_url')) || '');
      setAiKey((await getSiteConfig('ai_api_key')) || '');
      setAiModel((await getSiteConfig('ai_model')) || 'gpt-4o-mini');
      setAiMaxContent((await getSiteConfig('ai_max_content_length')) || '100000');
      setMcpKey((await getSiteConfig('mcp_api_key')) || '');
    })();
  }, []);

  useEffect(() => { setLocalVars(customVars); }, [customVars]);

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
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">系统设置</h1>

      <div className="max-w-lg space-y-8">
        {/* Site Info */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">站点信息</h2>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">站点标题</label>
            <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]" />
          </div>
        </section>

        {/* Registration */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">注册设置</h2>
          <select value={regMode} onChange={(e) => setRegMode(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]">
            <option value="open">开放注册</option>
            <option value="invite">邀请注册</option>
            <option value="closed">关闭注册</option>
          </select>
        </section>

        {/* AI Config */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">AI 配置</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Provider URL</label>
              <input value={aiUrl} onChange={(e) => setAiUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">API Key</label>
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
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Model</label>
              <input value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">内容截断长度 (字符)</label>
              <input type="number" value={aiMaxContent} onChange={(e) => setAiMaxContent(e.target.value)}
                placeholder="100000"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]" />
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">超过此长度的文章内容会被截断，防止超出 AI 模型上下文窗口。默认 100000</p>
            </div>
          </div>
        </section>

        {/* MCP Config */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">MCP API Key</h2>
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              MCP Key 用于 Claude Code、Cursor 等 AI 客户端通过 MCP 协议管理博客文章。
              配置方法请参考 <code className="text-[var(--primary)]">docs/</code> 目录下的文档。
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
                      复制 Key
                    </button>
                    <button type="button" onClick={handleGenerateMcpKey}
                      className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                      重新生成
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={handleGenerateMcpKey}
                  className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity">
                  生成 MCP Key
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Light / Dark Mode */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">外观模式</h2>
          <div className="flex gap-2">
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
          </div>
          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            当前实际模式：<span className="font-medium text-[var(--foreground)]">{resolved === 'dark' ? '暗色' : '亮色'}</span>
          </div>
        </section>

        {/* Theme Style */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">主题风格</h2>
          <div className="grid grid-cols-2 gap-3">
            {BUILTIN_THEMES.filter(t => t.id !== 'custom').map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  theme === t.id
                    ? 'border-[var(--ring)] ring-2 ring-[var(--ring)] bg-[var(--accent)]'
                    : 'border-[var(--border)] hover:bg-[var(--accent)]'
                }`}>
                <div className="text-sm font-medium text-[var(--foreground)]">{t.name}</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Custom theme */}
          <details className="mt-4">
            <summary className="text-sm font-medium text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)]">
              自定义主题 {theme === 'custom' ? '（当前）' : ''}
            </summary>
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-[var(--border)]">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(localVars).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-[10px] text-[var(--muted-foreground)] mb-0.5">{key}</label>
                    {key === '--font-body' || key === '--font-heading' ? (
                      <input value={val} onChange={(e) => setLocalVars({ ...localVars, [key]: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] font-mono" />
                    ) : key === '--radius' ? (
                      <input value={val} onChange={(e) => setLocalVars({ ...localVars, [key]: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] font-mono" />
                    ) : (
                      <div className="flex gap-1">
                        <input type="color" value={val} onChange={(e) => setLocalVars({ ...localVars, [key]: e.target.value })}
                          className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer" />
                        <input value={val} onChange={(e) => setLocalVars({ ...localVars, [key]: e.target.value })}
                          className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] font-mono" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTheme('custom'); setCustomVars(localVars); }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90">
                  应用自定义
                </button>
                <button onClick={resetCustom}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  重置为默认
                </button>
              </div>
            </div>
          </details>
        </section>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </AdminLayout>
  );
}
