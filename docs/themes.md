# i_blog 主题配置指导

## 概述

i_blog 的主题系统基于 **CSS 变量（Custom Properties）**，不依赖任何 CSS 预处理器或框架。
任何水平的 CSS 用户都可以通过修改变量值来定制博客外观。

## 快速开始

### 方法一：管理后台自定义

1. 登录管理后台 → 设置 → 主题风格
2. 在"自定义主题"区域调整颜色和字体
3. 点击"应用自定义"实时预览

### 方法二：上传 CSS 文件

1. 编写一个 `.css` 文件，包含 `:root` 和可选的 `.dark` 变量
2. 登录管理后台 → 主题 → 上传 CSS 文件
3. 点击"启用"生效

### 方法三：直接编辑主题 CSS

直接修改 `src/styles/themes/` 下的 CSS 文件（需重新构建）。

## CSS 变量清单

### 基础色

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--background` | 页面背景色 | `#ffffff` |
| `--background-secondary` | 次要背景（如侧栏） | `#f8f9fa` |
| `--foreground` | 正文文字色 | `#171717` |
| `--foreground-secondary` | 次要文字色 | `#6b7280` |

### 卡片

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--card` | 卡片背景色 | `#ffffff` |
| `--card-foreground` | 卡片文字色 | `#171717` |

### 交互色

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--primary` | 主色（按钮、链接、选中态） | `#3b82f6` |
| `--primary-foreground` | 主色上的文字色 | `#ffffff` |
| `--primary-hover` | 主色悬停态 | `#2563eb` |
| `--secondary` | 次要色 | `#f3f4f6` |
| `--secondary-foreground` | 次要色上的文字 | `#1f2937` |
| `--accent` | 强调色（悬停背景） | `#eff6ff` |
| `--accent-foreground` | 强调色上的文字 | `#1d4ed8` |
| `--muted` | 弱化色 | `#f3f4f6` |
| `--muted-foreground` | 弱化文字 | `#6b7280` |
| `--destructive` | 危险色（删除按钮） | `#ef4444` |
| `--destructive-foreground` | 危险色上的文字 | `#ffffff` |

### 边框与输入

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--border` | 边框色 | `#e5e7eb` |
| `--input` | 输入框边框 | `#e5e7eb` |
| `--ring` | 焦点环色 | `#3b82f6` |

### 尺寸

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--radius` | 圆角大小 | `0.5rem` |
| `--max-width` | 内容区最大宽度 | `720px` |

### 字体

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `--font-body` | 正文字体 | `'Inter', system-ui, sans-serif` |
| `--font-heading` | 标题字体 | `'Inter', system-ui, sans-serif` |
| `--font-mono` | 等宽字体（代码） | `'JetBrains Mono', 'Fira Code', monospace` |

## 创建自定义主题

### 最小主题文件

创建一个 `.css` 文件，只需覆写需要修改的变量：

```css
/* my-theme.css — 仅覆写几个关键变量 */
:root {
  --background: #fefcf9;
  --foreground: #1a1a2e;
  --primary: #d97706;
  --primary-hover: #b45309;
  --font-body: 'Merriweather', Georgia, serif;
}

.dark {
  --background: #1c1917;
  --foreground: #f5f5f4;
  --primary: #f59e0b;
}
```

### 完整主题示例

参考 `src/styles/themes/starter.css` 查看完整示例。

### 主题命名规范

- 自定义主题 CSS 类名必须使用 `.theme-{name}` 格式
- 用户上传的 CSS 可以不用类名前缀（系统自动注入）

### CSS 优先级说明

```
内置主题 CSS（通过 .theme-* 类选择器）
    ↓
用户上传的主题 CSS（注入到页面末尾，覆盖内置变量）
    ↓
管理后台自定义变量（通过 style 属性设置，优先级最高）
```

## 内置主题

| 文件名 | 类名 | 风格 |
|--------|------|------|
| `default.css` | `.theme-default` | 蓝色系，清晰简洁 |
| `starter.css` | `.theme-starter` | 暖色调，衬线字体 |
| `developer.css` | `.theme-developer` | 冷灰色，代码友好 |
| `minimal.css` | `.theme-minimal` | 极简黑白风格 |
| `night.css` | `.theme-night` | 深色模式专用 |

## 编辑器样式适配

如果自定义主题需要调整编辑器样式，覆写以下 CSS 变量：

```css
:root {
  --editor-toolbar-bg: var(--background-secondary);
  --editor-toolbar-button-hover: var(--accent);
  --editor-toolbar-button-active: var(--primary);
  --editor-caret: var(--foreground);
  --editor-selection-bg: rgba(59, 130, 246, 0.2);
}
```

> 注意：编辑器样式变量目前通过 `editor.css` 中的硬编码颜色控制。
> 后续版本将迁移到 CSS 变量体系。

## 故障排除

**问题：应用主题后某些颜色没有变化**

可能原因：
1. CSS 优先级不足 — 使用更具体的选择器或 `!important`
2. 变量名拼写错误 — 检查变量名是否与清单一致
3. 上传的 CSS 文件为空 — 确认文件包含有效的 CSS

**问题：暗色模式不生效**

确保 CSS 中包含 `.dark` 块：

```css
.dark {
  --background: #000000;
  --foreground: #ffffff;
}
```

部分主题（如 `night.css`）仅支持暗色模式，选择后会自动切换。
