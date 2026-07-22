export interface FontOption {
  id: string;
  name: string;
  fontBody: string;
  fontHeading: string;
  googleFont?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'system',
    name: '系统默认',
    fontBody: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
    fontHeading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
  },
  {
    id: 'noto-sans',
    name: 'Noto Sans',
    fontBody: '"Noto Sans SC", Inter, system-ui, sans-serif',
    fontHeading: '"Noto Sans SC", Inter, system-ui, sans-serif',
    googleFont: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap',
  },
  {
    id: 'noto-serif',
    name: 'Noto Serif',
    fontBody: '"Noto Serif SC", Lora, Georgia, serif',
    fontHeading: '"Noto Serif SC", Lora, Georgia, serif',
    googleFont: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap',
  },
  {
    id: 'wenkai',
    name: '霞鹜文楷',
    fontBody: '"LXGW WenKai", "KaiTi", "STKaiti", serif',
    fontHeading: '"LXGW WenKai", "KaiTi", "STKaiti", serif',
    googleFont: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai:wght@400;700&display=swap',
  },
  {
    id: 'sarasa',
    name: '更纱黑体',
    fontBody: '"Sarasa Gothic SC", "Sarasa Gothic", system-ui, sans-serif',
    fontHeading: '"Sarasa Gothic SC", "Sarasa Gothic", system-ui, sans-serif',
  },
  {
    id: 'system-mono',
    name: '等宽搭配',
    fontBody: '"JetBrains Mono", "Fira Code", "Noto Sans SC", system-ui, monospace',
    fontHeading: '"JetBrains Mono", "Fira Code", "Noto Sans SC", system-ui, monospace',
    googleFont: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
  },
];

export const FONT_PREVIEW_ZH = '预览字体效果：设计师的灵感源于对生活的观察与思考。';
export const FONT_PREVIEW_EN = 'The quick brown fox jumps over the lazy dog. 1234567890';

export function getDefaultFontId(): string {
  return 'system';
}

export function findFontOption(fontId: string): FontOption {
  return FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0];
}