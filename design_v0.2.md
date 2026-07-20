# i_blog — 设计文档 v0.2

## 1. 概述

### 1.1 目标与定位

构建一个现代化博客 CMS，对标 WordPress 功能集，但技术栈全面升级：

- **编辑器**：WYSIWYG Markdown 编辑器（Tiptap），同时支持传统 Markdown 源码编辑
- **内容管理**：文章（Posts）+ 页面（Pages）+ 分类法（Taxonomies）
- **用户系统**：角色体系、注册控制、个人资料
- **扩展性**：插件系统 + 主题系统，前端样式可完全定制
- **部署**：Docker + Supabase，前后端一体

### 1.2 与 v0.1 的关系

v0.1 在 `markdown_visual_editor/` 中开发了一个独立的 WYSIWYG Markdown 编辑器。
v0.2 `i_blog/` 是基于该编辑器的经验从头构建的完整博客 CMS。编辑器引擎将被抽取为独立模块，作为博客系统的核心组件。
`vibe_blog_next/` 仅作为数据库 schema 和功能设计的参考，不直接复现代码。

### 1.3 技术栈

| 层 | 技术 | 用途 |
|----|------|------|
| 框架 | Next.js 16 (App Router) | 全栈框架 |
| 语言 | TypeScript | 类型安全 |
| 包管理 | pnpm | 依赖管理 |
| 数据库 | Supabase (PostgreSQL) | 数据持久化 |
| 认证 | Supabase Auth | 用户认证 |
| 存储 | Supabase Storage | 媒体文件 |
| 编辑器 | Tiptap (ProseMirror) | WYSIWYG 编辑 |
| 样式 | Tailwind CSS v4 + shadcn/ui | UI 组件 |
| 部署 | Docker + PM2 | 生产部署 |

### 1.4 设计原则

1. **内容优先**：编辑体验是核心，所有功能围绕内容创作展开
2. **渐进增强**：基础功能开箱即用，高级功能通过插件/主题扩展
3. **AI Agent 友好**：所有 UI 元素具有机器可识别的 data-testid
4. **SSR 优先**：公开页面默认服务端渲染，管理后台客户端渲染

---

## 2. 内容模型

### 2.1 Posts（文章）

```
posts
├── id            uuid PK
├── author_id     uuid FK → auth.users
├── title         varchar(255)
├── slug          varchar(255) UNIQUE
├── content       text (Markdown)
├── excerpt       text ?
├── cover_image_url text ?
├── status        enum: draft / published / scheduled
├── published_at  timestamptz ?
├── is_pinned     boolean default false
├── meta          jsonb (自定义字段)
├── created_at    timestamptz
└── updated_at    timestamptz
```

- **Slug**：自动从 title 生成，支持手动修改
- **Content**：始终以 Markdown 格式存储，编辑器负责渲染
- **Status**：草稿 / 已发布 / 定时发布
- **Pinned**：置顶文章在首页优先展示
- **Meta**：自定义字段（JSON），插件可注入额外数据

### 2.2 Pages（页面）

```
pages
├── id            uuid PK
├── author_id     uuid FK → auth.users
├── title         varchar(255)
├── slug          varchar(255) UNIQUE
├── content       text (Markdown)
├── excerpt       text ?
├── parent_id     uuid FK → pages ? （父子页面，层级结构）
├── template      varchar(100) default 'default' （页面模板）
├── sort_order    int default 0
├── status        enum: draft / published
├── meta          jsonb
├── created_at    timestamptz
└── updated_at    timestamptz
```

- 独立于 Posts 的路由 `/pages/*`
- 支持父子层级（如 `/about/team`）
- 模板系统：主题可注册多种页面模板
- 排序字段：控制导航菜单中页面的顺序

### 2.3 Taxonomies（分类法）

**Tags（标签）**

```
tags
├── id            uuid PK
├── name          varchar(100) UNIQUE
├── slug          varchar(100) UNIQUE
├── description   text ?
├── color         varchar(7) default '#3B82F6'
├── created_at    timestamptz
└── updated_at    timestamptz
```

**Categories（分类）**

```
categories
├── id            uuid PK
├── name          varchar(100) UNIQUE
├── slug          varchar(100) UNIQUE
├── description   text ?
├── parent_id     uuid FK → categories ?
├── sort_order    int default 0
├── created_at    timestamptz
└── updated_at    timestamptz
```

**关联表**

```
post_tags         post_id → posts, tag_id → tags
post_categories   post_id → posts, category_id → categories
```

- Tags：自由创建，轻量级，无层级
- Categories：树形结构，支持无限父子层级
- 一个 Post 可以有多个 Tag、多个 Category
- Pages 也可以关联 Tags/Categories（通过多态关联或独立关联表）

---

## 3. 用户系统

### 3.1 角色体系

| 角色 | 权限 |
|------|------|
| Admin | 全部权限：管理用户、插件、主题、设置 |
| Editor | 管理所有文章/页面，管理评论，不可管理用户/插件 |
| Author | 管理自己的文章/页面 |
| Subscriber | 可登录、评论、管理个人资料 |

### 3.2 注册控制

通过 `site_config` 表控制：

```json
{
  "registration_mode": "open | invite | closed"
}
```

- **open**：任何人都可注册
- **invite**：需要邀请码（invitations 表生成）
- **closed**：关闭注册，仅 Admin 可创建用户

### 3.3 用户资料

```
user_profiles（替代 vibe_blog_next 的 user_settings）
├── user_id       uuid PK FK → auth.users
├── display_name  varchar(100)
├── avatar_url    text ?
├── bio           text ?
├── website       text ?
├── social_links  jsonb ?
├── created_at    timestamptz
└── updated_at    timestamptz
```

### 3.4 认证流程

- Supabase Auth（Email + Password 为主）
- 可扩展 OAuth（GitHub、Google 等）
- 密码找回、邮箱验证
- Session 管理（Supabase SSR）

---

## 4. 评论系统

### 4.1 数据模型

```
comments
├── id              uuid PK
├── content_type    enum: post / page
├── content_id      uuid FK（多态关联 → posts.id 或 pages.id）
├── author_id       uuid FK → auth.users ?
├── author_name     varchar(100) ?（游客）
├── author_email    varchar(255) ?（游客）
├── ip              varchar(45) ?
├── parent_id       uuid FK → comments ?
├── content         text
├── status          enum: approved / pending / spam / trash
├── created_at      timestamptz
└── updated_at      timestamptz
```

### 4.2 功能特性

- **线程化评论**：无限层级嵌套
- **登录用户评论**：自动关联 author_id
- **游客评论**：填写姓名 + 邮箱
- **评论审核**：Admin/Editor 可审核（通过/垃圾/删除）
- **评论点赞**（独立表 comment_likes）
- **评论通知**：被回复时邮件通知（远期）

### 4.3 评论渲染

- 前端递归渲染树形结构
- 支持分页加载
- 新评论通过 Server Action 提交

---

## 5. 编辑器架构

### 5.1 设计原则

编辑器是 i_blog 的核心创作工具，设计上以下三点优先：

1. **Markdown 即源码**：编辑器内部始终以 Markdown 为唯一数据源，Tiptap 文档只在内存中存在
2. **双向同步**：源码面板 ↔ Markdown ↔ Tiptap 文档三者实时同步
3. **插件化扩展**：编辑器功能通过插件注册（工具栏按钮、NodeView、快捷键等），核心引擎保持精简

### 5.2 编辑器模式

| 模式 | 说明 |
|------|------|
| WYSIWYG | 所见即所得富文本编辑（默认） |
| 源码 | 传统 Markdown textarea 编辑 |
| 分栏 | 左侧编辑，右侧实时预览 |

用户通过 `localStorage` 持久化模式偏好。

### 5.3 内容流转

```
从 post-editor 初始化：
  Markdown string → marked.parse() → HTML
    → generateJSON() → ProseMirror JSON → tiptap editor

用户在 WYSIWYG 模式输入：
  tiptap editor → onUpdate → getMarkdown() → content state

用户在源码面板输入：
  textarea onChange → migrateMarkdownSyntax() → marked.parse()
    → generateJSON() → insertContent() → tiptap editor

保存时：
  content state (Markdown) → Supabase posts.content
```

### 5.4 编辑器包结构（初期在 i_blog 项目内）

```
src/editor/
├── core/
│   ├── wysiwyg-editor.tsx     ← 编辑器主组件
│   └── extensions.ts          ← Tiptap 扩展配置
├── toolbar/
│   ├── toolbar.tsx            ← 工具栏组件
│   └── color-picker-panel.tsx ← 颜色选择器
├── node-views/
│   ├── heading-node-view.tsx
│   ├── blockquote-node-view.tsx
│   ├── code-block-node-view.tsx
│   ├── image-node-view.tsx
│   ├── link-node-view.tsx
│   └── mermaid-node-view.tsx
├── plugins/
│   ├── link-double-click.ts   ← 双击链接编辑
│   └── table-context-menu.tsx ← 表格右键菜单
├── lib/
│   ├── markdown-migrate.ts    ← Markdown 预处理
│   └── export.ts              ← 导出功能
└── styles/
    └── editor.css             ← 编辑器样式
```

### 5.5 从 v0.1 迁移策略

直接拷贝 `markdown_visual_editor/src/components/editor/` 下的文件，做以下适配：

- 移除独立 Editor（`useEditor` 初始化移入 blog 的 PostEditor）
- 颜色选择器的 CSS 变量改为引用 shadcn/ui 的 `--primary`、`--background` 等
- 暗色模式跟随 blog 的 theme provider，不再独立控制
- 工具栏按钮样式改为 shadcn/ui Button 组件
- 图片上传对接 Supabase Storage

### 5.6 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+B | 粗体 |
| Ctrl+I | 斜体 |
| Ctrl+K | 插入链接 |
| Ctrl+Shift+X | 删除线 |
| Ctrl+Shift+H | 高亮 |
| Ctrl+Z | 撤销 |
| Ctrl+Shift+Z | 重做 |
| Tab | 缩进（代码块/列表） |

---

## 6. 数据库 Schema

### 6.1 设计原则

- 基于 Supabase (PostgreSQL 15+)
- 所有表启用 RLS（Row Level Security）
- 使用 `gen_random_uuid()` 作为主键
- 时间戳字段统一使用 `timestamptz`
- 软删除优先（`deleted_at` 字段）
- 全文搜索使用 `pg_trgm` 扩展

### 6.2 表清单

| 表 | 说明 | 来源 |
|----|------|------|
| `posts` | 文章 | 参考 vibe_blog_next |
| `pages` | 页面 | 新增 |
| `tags` | 标签 | 参考 vibe_blog_next |
| `categories` | 分类 | 新增 |
| `post_tags` | 文章-标签关联 | 参考 vibe_blog_next |
| `post_categories` | 文章-分类关联 | 新增 |
| `comments` | 评论 | 参考 vibe_blog_next，改为多态 |
| `comment_likes` | 评论点赞 | 参考 vibe_blog_next |
| `user_profiles` | 用户资料 | 参考 vibe_blog_next user_settings |
| `site_config` | 站点配置（键值对） | 参考 vibe_blog_next |
| `media` | 媒体文件 | 新增 |
| `plugins` | 插件注册表 | 新增 |
| `themes` | 主题注册表 | 新增 |
| `invitations` | 邀请码 | 新增 |
| `post_revisions` | 文章版本 | 新增 |

### 6.3 关键索引

- `posts`: slug UNIQUE, author_id, status, published_at, 全文搜索索引(title, content)
- `pages`: slug UNIQUE, parent_id, sort_order
- `tags`: name UNIQUE, slug UNIQUE
- `categories`: name UNIQUE, slug UNIQUE, parent_id
- `comments`: (content_type, content_id), parent_id, status, created_at
- `media`: uploader_id, content_type

### 6.4 RLS 策略

| 表 | Select | Insert | Update | Delete |
|----|--------|--------|--------|--------|
| posts | published=TRUE OR author=own OR role=admin/editor | auth required | own OR admin/editor | own OR admin |
| pages | published=TRUE OR author=own OR role=admin/editor | auth required | own OR admin/editor | own OR admin |
| tags | 公开 | admin/editor | admin/editor | admin |
| categories | 公开 | admin/editor | admin/editor | admin |
| comments | 公开 | 任意（需 captcha） | own OR admin/editor | admin/editor |
| user_profiles | 公开 | auth（自己） | 自己 | admin |
| media | 公开 | auth required | 自己 | 自己 OR admin |

---

## 7. 前端路由与布局

### 7.1 公共路由

| 路径 | 页面 | 渲染方式 |
|------|------|---------|
| `/` | 首页（文章列表 + 置顶） | SSR |
| `/blog/[slug]` | 文章详情 | SSR |
| `/pages/[slug]` | 页面 | SSR |
| `/tags/[slug]` | 标签归档 | SSR |
| `/categories/[slug]` | 分类归档 | SSR |
| `/search` | 搜索结果 | SSR |
| `/author/[id]` | 作者主页 | SSR |

### 7.2 管理路由

| 路径 | 页面 | 渲染方式 |
|------|------|---------|
| `/admin` | 仪表盘 | CSR |
| `/admin/posts` | 文章管理 | CSR |
| `/admin/posts/new` | 新建文章（编辑器） | CSR |
| `/admin/posts/[id]/edit` | 编辑文章（编辑器） | CSR |
| `/admin/pages` | 页面管理 | CSR |
| `/admin/pages/new` | 新建页面（编辑器） | CSR |
| `/admin/pages/[id]/edit` | 编辑页面（编辑器） | CSR |
| `/admin/tags` | 标签管理 | CSR |
| `/admin/categories` | 分类管理 | CSR |
| `/admin/comments` | 评论管理 | CSR |
| `/admin/media` | 媒体库 | CSR |
| `/admin/users` | 用户管理（Admin only） | CSR |
| `/admin/plugins` | 插件管理 | CSR |
| `/admin/themes` | 主题管理 | CSR |
| `/admin/settings` | 系统设置 | CSR |
| `/admin/settings/registration` | 注册设置 | CSR |

### 7.3 布局系统

- **PublicLayout**：博客公共页面（header + content + footer）
- **AdminLayout**：管理后台（侧边栏 + 顶部导航 + 内容区）
- **AuthLayout**：登录/注册页（简约居中）
- 主题可注册自定义布局

---

## 8. 开发路线

### Phase 0：项目脚手架（2天）

- [ ] pnpm init、Next.js 初始化
- [ ] Tailwind CSS v4 + shadcn/ui 配置
- [ ] Supabase 客户端配置
- [ ] ESLint + TypeScript 配置
- [ ] Dockerfile + docker-compose.yml
- [ ] AGENTS.md + design_v0.2.md

### Phase 1：内容模型（5天）

- [ ] Supabase 数据库 schema（全部表）
- [ ] RLS 策略
- [ ] Server Actions：Posts CRUD
- [ ] 前端：文章列表页、文章详情页
- [ ] 前端：管理后台框架（AdminLayout）
- [ ] 前端：文章管理页面

### Phase 2：编辑器集成（5天）

- [ ] 拷贝适配编辑器组件（从 markdown_visual_editor）
- [ ] Tiptap 扩展配置（含 Markdown + 数学 + 颜色）
- [ ] 工具栏组件
- [ ] NodeViews（heading / blockquote / code / image / link / mermaid）
- [ ] 颜色选择器
- [ ] 表格操作（工具栏 + 右键菜单）
- [ ] 内容同步（Markdown ↔ Tiptap）

### Phase 3：用户系统 + 评论（4天）

- [ ] 注册/登录/登出
- [ ] 用户资料管理
- [ ] 角色权限中间件
- [ ] 注册控制（open / invite / closed）
- [ ] 评论 CRUD + 审核
- [ ] 评论前台渲染

### Phase 4：Pages + Tags + Categories（3天）

- [ ] Pages CRUD + 父子层级
- [ ] Tags / Categories CRUD
- [ ] 前端归档页面
- [ ] 文章编辑器整合 Tags / Categories 选择

### Phase 5：管理后台完善（4天）

- [ ] 仪表盘（统计概览）
- [ ] 评论管理
- [ ] 媒体库
- [ ] 用户管理
- [ ] 系统设置
- [ ] 个人设置

### Phase 6：搜索 + 媒体（3天）

- [ ] 全文搜索（pg_trgm）
- [ ] 搜索结果页面
- [ ] 媒体上传（Supabase Storage）
- [ ] 编辑器图片插入（对接 Storage）

### Phase 7：插件 + 主题系统（5天）

- [ ] 插件注册/管理 UI
- [ ] 插件 API 核心（扩展点）
- [ ] 主题 CSS 变量体系
- [ ] 主题安装/切换
- [ ] 示例 starter-blog 主题包

### Phase 8：测试 + 部署（3天）

- [ ] 功能测试
- [ ] Docker 构建 + 部署文档
- [ ] 响应式测试
- [ ] 性能优化

### 总计：~34 天

---

## 9. 插件系统（概要）

### 9.1 插件定义

```typescript
interface BlogPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;

  // 生命周期
  onInstall?(): void;
  onActivate?(): void;
  onDeactivate?(): void;
  onUninstall?(): void;

  // 扩展点
  extendToolbar?(items: ToolbarItem[]): ToolbarItem[];
  extendEditor?(extensions: Extension[]): Extension[];
  extendNodeViews?(views: NodeViewRegistration[]): NodeViewRegistration[];
  extendRoutes?(routes: Route[]): Route[];
  extendSettings?(tabs: SettingsTab[]): SettingsTab[];
  extendSearch?(query: string, results: SearchResult[]): SearchResult[];

  // 内容钩子
  onPublish?(content: { post: Post }): void;
  onSave?(content: { post: Post }): void;
  onDelete?(content: { postId: string }): void;
}
```

### 9.2 插件管理

- 插件存放在 `src/plugins/` 目录
- 通过 `plugins` 表记录已安装/激活的插件
- 管理后台可安装、激活、停用、卸载
- 不支持运行时热加载（需重新部署）— 简化初期实现

---

## 10. 主题系统（概要）

### 10.1 CSS 变量体系

主题通过 CSS 变量控制外观，所有编辑器 UI + 博客 UI 引用这些变量：

```css
:root {
  /* 基础色 */
  --color-bg: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-text: #1a1a1a;
  --color-text-secondary: #6b7280;
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-border: #e5e7eb;

  /* 编辑器特定 */
  --editor-bg: var(--color-bg);
  --editor-toolbar-bg: var(--color-bg-secondary);
  --editor-toolbar-button-hover: #e5e7eb;
  --editor-toolbar-button-active: var(--color-primary);
  --editor-caret: var(--color-text);
  --editor-selection-bg: #bfdbfe;

  /* 排版 */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --prose-max-width: 720px;

  /* 间距 */
  --spacing-page: 2rem;
  --spacing-section: 1.5rem;
  --spacing-element: 1rem;
}

.dark {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #1a1a1a;
  --color-text: #ededed;
  --color-text-secondary: #9ca3af;
  --color-primary: #60a5fa;
  --color-border: #333;
  --editor-toolbar-button-hover: #333;
  --editor-caret: #fff;
  --editor-selection-bg: #1e3a5f;
}
```

### 10.2 主题切换

- 主题 = 一套 CSS 变量值
- 通过 `themes` 表注册
- 前端通过 ThemeSelector 切换
- 默认主题：内置 light / dark 变体

### 10.3 复用 tailwind-nextjs-starter-blog

其 CSS 可提供的参考：

| starter-blog 模块 | 对应我们的 |
|-------------------|-----------|
| `tailwind.config.js` primaryColor | `--color-primary` |
| `css/prism.css` | `--font-mono` + highlight.js theme CSS |
| prose 排版样式 | `--prose-*` 变量 + `@tailwindcss/typography` |
| PostLayout / PostSimple | 我们的 PostLayout（通过模板切换） |

---

## 11. 搜索系统（概要）

- 全文搜索基于 PostgreSQL `pg_trgm` 扩展
- 搜索范围：posts.title + posts.content + tags.name
- 搜索结果按相关性排序（pg_trgm 的 similarity）
- 支持中文分词（pg_trgm 的 trigram 对中文也有一定效果）
- 搜索插件接口：第三方可替换为 Algolia / Meilisearch（通过 `extendSearch` 扩展点）

---

## 12. 媒体库（概要）

```
media
├── id              uuid PK
├── uploader_id     uuid FK → auth.users
├── filename        varchar(255)        （原始文件名）
├── storage_path    text                （Supabase Storage 路径）
├── content_type    varchar(100)        （MIME type）
├── size            int                 （字节）
├── width           int ?               （图片宽度）
├── height          int ?               （图片高度）
├── alt             text ?
├── created_at      timestamptz
```

- 文件存储于 Supabase Storage bucket `media`
- 上传时自动生成缩略图（可选）
- 媒体库列表以网格展示，支持筛选（图片/文档/全部）

---

## 13. 认证与安全（概要）

- Supabase Auth（Email + Password）
- RLS 保护所有表
- API rate limiting（参考 vibe_blog_next 实现）
- 评论防 spam（honeypot + rate limiting，远期可加 captcha）
- Session 通过 Supabase SSR cookie 管理

---

## 14. 与 WordPress 功能对标

| 功能 | WordPress | i_blog v0.2 |
|------|-----------|-------------|
| 文章 (Posts) | ✅ | ✅ |
| 页面 (Pages) | ✅ | ✅ |
| 分类 (Categories) | ✅ | ✅ |
| 标签 (Tags) | ✅ | ✅ |
| 评论 | ✅ | ✅ |
| 用户角色 | ✅ | ✅ |
| 注册控制 | ✅ | ✅ |
| 媒体库 | ✅ | ✅ |
| 插件系统 | ✅ | ✅（定制 API） |
| 主题系统 | ✅ | ✅（CSS 变量 + 组件） |
| 块编辑器 (Gutenberg) | ✅ | ⏳ 远期 |
| REST API | ✅ | ✅ |
| 自定义字段 | ✅ | ✅（meta jsonb） |
| 文章版本 | ✅ | ✅（post_revisions） |
| 小工具 (Widgets) | ✅ | ⏳ 远期 |
| 自定义菜单 | ✅ | ⏳ 远期 |
| 多站点 | ✅ | ❌ 暂不 |
| 自定义文章类型 (CPT) | ✅ | ⏳ 远期 |
