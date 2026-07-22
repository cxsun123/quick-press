'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { saveSiteTheme, updateSiteConfig, getSiteConfig } from '@/server/actions/site-config.actions';
import { FONT_OPTIONS, FONT_PREVIEW_ZH, FONT_PREVIEW_EN, getDefaultFontId, findFontOption, type FontOption } from '@/lib/fonts';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BlogTheme = 'default' | 'starter' | 'developer' | 'minimal' | 'night' | 'custom';

const CUSTOM_VARS_KEY = 'blogCustomTheme';
const FONT_KEY = 'fontFamily';
const BG_IMAGE_KEY = 'bgImageUrl';
const BG_OPACITY_KEY = 'bgOpacity';

export interface ThemeVars {
  '--background': string;
  '--background-secondary': string;
  '--foreground': string;
  '--foreground-secondary': string;
  '--primary': string;
  '--primary-foreground': string;
  '--primary-hover': string;
  '--border': string;
  '--ring': string;
  '--font-body': string;
  '--font-heading': string;
  '--radius': string;
}

const defaultCustomVars: ThemeVars = {
  '--background': '#ffffff',
  '--background-secondary': '#f8f9fa',
  '--foreground': '#171717',
  '--foreground-secondary': '#6b7280',
  '--primary': '#3b82f6',
  '--primary-foreground': '#ffffff',
  '--primary-hover': '#2563eb',
  '--border': '#e5e7eb',
  '--ring': '#3b82f6',
  '--font-body': 'Inter, system-ui, sans-serif',
  '--font-heading': 'Inter, system-ui, sans-serif',
  '--radius': '0.5rem',
};

function loadGoogleFont(url: string | undefined) {
  if (!url) return;
  const id = 'qp-google-font';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  theme: BlogTheme;
  customVars: ThemeVars;
  fontFamily: string;
  bgImageUrl: string;
  bgOpacity: number;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: BlogTheme) => void;
  setCustomVars: (vars: ThemeVars) => void;
  resetCustom: () => void;
  setFontFamily: (fontId: string) => void;
  setBgImage: (url: string) => void;
  setBgOpacity: (opacity: number) => void;
  clearBgImage: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [theme, setThemeState] = useState<BlogTheme>('default');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const [customVars, setCustomVarsState] = useState<ThemeVars>(defaultCustomVars);
  const [fontFamily, setFontFamilyState] = useState<string>(getDefaultFontId());
  const [bgImageUrl, setBgImageUrlState] = useState<string>('');
  const [bgOpacity, setBgOpacityState] = useState<number>(100);
  const [userThemeUrl, setUserThemeUrl] = useState<string | null>(null);

  const userStyleId = 'i-blog-user-theme';

  const applyFontFamily = (fontId: string) => {
    const opt = FONT_OPTIONS.find(f => f.id === fontId);
    if (!opt) return;
    loadGoogleFont(opt.googleFont);
    const root = document.documentElement;
    root.style.setProperty('--font-body', opt.fontBody);
    root.style.setProperty('--font-heading', opt.fontHeading);
  };

  const applyBgImage = (url: string, opacity: number) => {
    const body = document.body;
    if (url) {
      body.style.backgroundImage = `url(${JSON.stringify(url)})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundAttachment = 'fixed';
      body.style.setProperty('--bg-opacity', String(opacity / 100));
    } else {
      body.style.backgroundImage = '';
      body.style.backgroundSize = '';
      body.style.backgroundPosition = '';
      body.style.backgroundRepeat = '';
      body.style.backgroundAttachment = '';
      body.style.removeProperty('--bg-opacity');
    }
    body.classList.toggle('has-bg-image', !!url);
  };

  const applyVars = (vars: ThemeVars) => {
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
  };

  const loadUserTheme = async (t: BlogTheme) => {
    const old = document.getElementById(userStyleId);
    if (old) old.remove();

    if (t !== 'custom') {
      setUserThemeUrl(null);
      return;
    }

    if (!userThemeUrl) {
      try {
        const res = await fetch('/api/active-theme');
        const data = await res.json();
        if (data.url) {
          setUserThemeUrl(data.url);
          const link = document.createElement('link');
          link.id = userStyleId;
          link.rel = 'stylesheet';
          link.href = data.url;
          document.head.appendChild(link);
        }
      } catch {}
    }
  };

  const apply = (m: ThemeMode, t: BlogTheme, cv: ThemeVars) => {
    const systemDark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const isDark = systemDark || t === 'night';
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.classList.remove('theme-default', 'theme-starter', 'theme-developer', 'theme-minimal', 'theme-night', 'theme-custom');
    if (t === 'custom') {
      root.classList.add('theme-custom');
      applyVars(cv);
    } else {
      root.classList.add(`theme-${t}`);
    }
    setResolved(isDark ? 'dark' : 'light');
  };

  const syncToServer = useCallback((m: ThemeMode, t: BlogTheme) => {
    saveSiteTheme(m, t).catch(() => {});
  }, []);

  const loadFontAndBgFromServer = useCallback(async () => {
    try {
      const [fontId, bgUrl, bgOp] = await Promise.all([
        getSiteConfig('font_family'),
        getSiteConfig('bg_image_url'),
        getSiteConfig('bg_image_opacity'),
      ]);
      if (fontId) {
        setFontFamilyState(fontId);
        applyFontFamily(fontId);
      }
      if (bgUrl) {
        setBgImageUrlState(bgUrl);
        const op = bgOp ? parseInt(bgOp) : 100;
        setBgOpacityState(op);
        applyBgImage(bgUrl, op);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeClass = Array.from(root.classList).find(c => c.startsWith('theme-'));
    const initTheme = (themeClass?.replace('theme-', '') || 'default') as BlogTheme;
    const dataMode = root.getAttribute('data-theme-mode');
    const initMode = (dataMode || 'system') as ThemeMode;

    let savedVars = defaultCustomVars;
    try {
      const raw = localStorage.getItem(CUSTOM_VARS_KEY);
      if (raw) savedVars = { ...defaultCustomVars, ...JSON.parse(raw) };
    } catch {}

    setModeState(initMode);
    setThemeState(initTheme);
    setCustomVarsState(savedVars);
    apply(initMode, initTheme, savedVars);

    const storedFont = localStorage.getItem(FONT_KEY);
    if (storedFont) {
      setFontFamilyState(storedFont);
      applyFontFamily(storedFont);
    }

    const storedBg = localStorage.getItem(BG_IMAGE_KEY);
    const storedBgOp = localStorage.getItem(BG_OPACITY_KEY);
    if (storedBg) {
      setBgImageUrlState(storedBg);
      const op = storedBgOp ? parseInt(storedBgOp) : 100;
      setBgOpacityState(op);
      applyBgImage(storedBg, op);
    }

    loadFontAndBgFromServer();

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (initMode === 'system') apply('system', initTheme, savedVars); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { apply(mode, theme, customVars); }, [mode, theme, customVars]);
  useEffect(() => { loadUserTheme(theme); }, [theme]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    apply(m, theme, customVars);
    syncToServer(m, theme);
  };

  const setTheme = (t: BlogTheme) => {
    setThemeState(t);
    apply(mode, t, customVars);
    syncToServer(mode, t);
  };

  const setCustomVars = (vars: ThemeVars) => {
    setCustomVarsState(vars);
    localStorage.setItem(CUSTOM_VARS_KEY, JSON.stringify(vars));
    if (theme === 'custom') applyVars(vars);
  };

  const resetCustom = () => {
    const def = defaultCustomVars;
    setCustomVarsState(def);
    localStorage.removeItem(CUSTOM_VARS_KEY);
    if (theme === 'custom') applyVars(def);
  };

  const setFontFamily = (fontId: string) => {
    setFontFamilyState(fontId);
    localStorage.setItem(FONT_KEY, fontId);
    applyFontFamily(fontId);
    updateSiteConfig('font_family', fontId).catch(() => {});
  };

  const setBgImage = (url: string) => {
    setBgImageUrlState(url);
    localStorage.setItem(BG_IMAGE_KEY, url);
    applyBgImage(url, bgOpacity);
    updateSiteConfig('bg_image_url', url).catch(() => {});
  };

  const setBgOpacity = (opacity: number) => {
    setBgOpacityState(opacity);
    localStorage.setItem(BG_OPACITY_KEY, String(opacity));
    applyBgImage(bgImageUrl, opacity);
    updateSiteConfig('bg_image_opacity', String(opacity)).catch(() => {});
  };

  const clearBgImage = () => {
    setBgImageUrlState('');
    setBgOpacityState(100);
    localStorage.removeItem(BG_IMAGE_KEY);
    localStorage.removeItem(BG_OPACITY_KEY);
    applyBgImage('', 100);
    updateSiteConfig('bg_image_url', '').catch(() => {});
    updateSiteConfig('bg_image_opacity', '100').catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{
      mode, resolved, theme, customVars,
      fontFamily, bgImageUrl, bgOpacity,
      setMode, setTheme, setCustomVars, resetCustom,
      setFontFamily, setBgImage, setBgOpacity, clearBgImage,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export const BUILTIN_THEMES: { id: BlogTheme; name: string; desc: string }[] = [
  { id: 'default', name: '默认主题', desc: '蓝色系，清晰简洁' },
  { id: 'starter', name: '阅读主题', desc: '暖色调，衬线字体，优化阅读体验' },
  { id: 'developer', name: '开发者主题', desc: '冷灰色，代码友好' },
  { id: 'minimal', name: '极简主题', desc: '干净简约，专注阅读' },
  { id: 'night', name: '夜间主题', desc: '深蓝黑色，护眼模式' },
  { id: 'custom', name: '自定义', desc: '自由定制颜色和字体' },
];
