'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { saveSiteTheme } from '@/server/actions/site-config.actions';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BlogTheme = 'default' | 'starter' | 'developer' | 'minimal' | 'night' | 'custom';

const CUSTOM_VARS_KEY = 'blogCustomTheme';

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

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  theme: BlogTheme;
  customVars: ThemeVars;
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: BlogTheme) => void;
  setCustomVars: (vars: ThemeVars) => void;
  resetCustom: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [theme, setThemeState] = useState<BlogTheme>('default');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const [customVars, setCustomVarsState] = useState<ThemeVars>(defaultCustomVars);
  const [userThemeUrl, setUserThemeUrl] = useState<string | null>(null);

  const userStyleId = 'i-blog-user-theme';

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
      root.style.cssText = '';
    }
    setResolved(isDark ? 'dark' : 'light');
  };

  const syncToServer = useCallback((m: ThemeMode, t: BlogTheme) => {
    saveSiteTheme(m, t).catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const hasDark = root.classList.contains('dark');
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

  return (
    <ThemeContext.Provider value={{ mode, resolved, theme, customVars, setMode, setTheme, setCustomVars, resetCustom }}>
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
