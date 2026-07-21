# Editor 包迁移设计文档

## 概述

将 `markdown_visual_editor` 的编辑器代码打包为 npm 包 `@chengxinsun26/editor`，quick-press 通过 `pnpm install` 引用。与其他第三方包一样的使用方式。

## 最终架构

```
markdown_visual_editor/          ← editor 开发地，独立 git repo
├── src/components/editor/
│   ├── index.ts                 ← barrel export
│   └── ...（所有 editor 组件）
├── package.json                 ← name: @chengxinsun26/editor
└── .npmrc                       ← shamefully-hoist

npm publish → @chengxinsun26/editor

quick-press/                          ← 从 fork clone
├── package.json                 ← "@chengxinsun26/editor": "^0.1.0"
├── next.config.ts               ← transpilePackages
└── ❌ src/editor/                ← 已删除
```

## 使用方式

```bash
# quick-press 安装（和其他包一样）
pnpm add @chengxinsun26/editor@^0.1.0

# 更新版本
pnpm update @chengxinsun26/editor
```

```ts
// quick-press 中导入（和其他包一样）
import { WysiwygEditor, defaultExtensions } from '@chengxinsun26/editor'
import { migrateMarkdownSyntax } from '@chengxinsun26/editor'
import '@chengxinsun26/editor/styles/editor.css'
```

## editor 包导出

| 导出 | 来源 |
|------|------|
| `WysiwygEditor`, `defaultExtensions`, `Toolbar`, `SourcePanel` | 核心组件 |
| `HeadingNodeView`, `BlockquoteNodeView`, `ImageNodeView` 等 | Node Views |
| `LinkDoubleClickListener`, `HtmlBlock` | Plugins |
| `createLongPressHandler` | 工具函数 |
| `migrateMarkdownSyntax`, `markdownToHtml` | Markdown 处理 |
| `editor.css`, `hljs-source.css` | 样式 |

## quick-press 保留的本地文件

- `src/components/blog/media-picker.tsx` — Supabase 媒体库（blog 专属）

## 发布流程

```bash
# 1. 在 markdown_visual_editor 改代码
# 2. 改版本号
npm version patch   # 0.1.0 → 0.1.1
# 3. 发布
npm publish
# 4. 在 quick-press 更新
cd ../quick-press
pnpm update @chengxinsun26/editor
```

## Fork 体验

```bash
git clone quick-press
cd quick-press
pnpm install   # 自动从 npm 拉取 @chengxinsun26/editor
```

## 注意事项

- editor 包导出 TypeScript 源码（.ts），quick-press 的 `transpilePackages` 负责编译
- peerDependencies: react ^19, react-dom ^19, next ^16
- editor 组件全部是 `'use client'`
