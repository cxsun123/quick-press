# quick-press — 项目指南

基于 Next.js + Supabase + Tiptap 的现代化博客 CMS，对标 WordPress 功能集。

## 当前状态 (Phase 1-5 完成，构建通过)

### 已完成的架构重构

```
旧架构 (已删除):                  新架构:
src/lib/actions/*                 src/server/actions/*  (薄封装)
src/lib/supabase/server.ts        src/server/services/* (业务逻辑)
src/lib/supabase/middleware.ts     src/server/repositories/* (数据访问)
src/lib/hooks/*                   src/server/db/ (client.ts, middleware.ts)
src/lib/auth/*                    src/models/ (共享类型)
                                  src/hooks/ (React Hooks)
```

删除的文件：`lib/actions/`、`lib/auth/`、`lib/hooks/`、`lib/db/`、`lib/utils/`
保留：`lib/supabase/client.ts`（浏览器端 Supabase 客户端，3 处引用）

### 已完成的功能

- [x] 服务端 3 层架构：actions → services → repositories
- [x] 共享类型模型 (src/models/)
- [x] 首页 / 文章列表 / 文章详情 / 页面详情
- [x] 登录 / 注册 / 登出
- [x] 管理后台 (仪表盘、文章、页面、标签、评论、媒体、主题、用户、设置)
- [x] 分类 / 标签归档页面
- [x] 搜索页面
- [x] 分页组件
- [x] 侧边栏 (最近文章、归档、分类、标签)
- [x] 主题系统 (浅色/深色/系统 + 5 种内置主题)
- [x] WYSIWYG 编辑器（Tiptap，含工具栏、颜色选择器、表格操作）
- [x] 全文搜索（PostgreSQL pg_trgm）
- [x] Docker 一键部署
- [x] 站点设置（博客名称、注册模式、主题风格）
- [x] AI 摘要（OpenAI 兼容 API 自动提取摘要和关键字）
- [x] 密码保护（文章支持公开/私密/密码保护 + 分享链接）
- [x] 本地 Supabase 开发环境

## 项目结构

```
quick-press/                 ← git repo
├── src/
│   ├── app/                 ← Next.js App Router
│   │   ├── (public)/        ← 公共页面（SSR）
│   │   ├── (auth)/          ← 登录/注册
│   │   ├── admin/           ← 管理后台（CSR）
│   │   └── api/             ← API 路由
│   ├── components/
│   │   ├── blog/            ← 博客前端组件
│   │   ├── admin/           ← 管理后台组件
│   │   └── ui/              ← shadcn/ui 组件
│   ├── server/              ← 服务端分层架构（三层）
│   │   ├── actions/         ← 第1层：Server Actions（薄封装，调用 services + revalidate）
│   │   ├── services/        ← 第2层：Service（业务逻辑编排，调用 repositories）
│   │   ├── repositories/    ← 第3层：Repository（数据访问，直接调用 Supabase/DAL）
│   │   ├── auth/            ← 角色与权限
│   │   ├── utils/           ← 服务端工具函数
│   │   └── db/              ← Supabase 客户端创建（client.ts, middleware.ts）
│   ├── models/              ← 共享类型定义（Post, Category, Tag 等）
│   ├── hooks/               ← React Hooks（use-theme, use-loading）
│   ├── plugins/             ← 编辑器插件
│   ├── styles/
│   │   └── editor.css       ← 编辑器样式
│   └── lib/supabase/        ← 仅 client.ts（浏览器端）
├── supabase/
│   ├── config.toml          ← Supabase 本地配置
│   ├── migrations/          ← 数据库迁移（README + 后续变更）
│   │   └── README.md
│   └── init.sql             ← 完整初始化 schema（新数据库使用）
├── development.md           ← 开发补充文档（调试、数据库、FAQ）
├── design_v0.2.md           ← 设计文档
├── Dockerfile
├── docker-compose.yml
├── .env.local               ← 本地 Supabase 凭据（不提交）
├── .env.production          ← 生产 Supabase 凭据（不提交）
└── AGENTS.md                ← 本文件
```

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **包管理**: pnpm
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **编辑器**: Tiptap (ProseMirror)
- **样式**: Tailwind CSS v4 + shadcn/ui
- **部署**: Vercel + Supabase （也可 Docker）

## 本地开发环境

### 前置依赖

- Node.js >= 20, pnpm >= 11.13
- Docker Desktop（Supabase 本地服务）
- Supabase CLI >= 2.109（`brew install supabase/tap/supabase`）

### 启动

```bash
pnpm install                  # 安装依赖
supabase start                 # 启动本地 Supabase（PostgreSQL + Auth + Storage + Studio）
pnpm dev                       # 启动 Next.js 开发服务器（localhost:3000）
```

### 本地服务

| 服务 | 地址 |
|------|------|
| 博客前台 | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Mailpit | http://127.0.0.1:54324 |

### 数据库迁移

```bash
supabase migration new <name>  # 创建迁移文件
# 编辑 supabase/migrations/<timestamp>_<description>.sql
supabase db reset               # 应用到本地
supabase db push                 # 推送到远程
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公开 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务角色密钥（仅服务端） |
| `NEXT_PUBLIC_SITE_TITLE` | 站点标题 |

`.env.local` = 本地 Supabase，`.env.production` = 远程 Supabase，均不提交。
Vercel 部署时在 Dashboard 配置，不需要本地文件。

## 开发命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建 + TypeScript 类型检查
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查
```

## 调试

- 浏览器 Network 面板查看 Server Action 请求
- `supabase db query "SELECT ..."` 直接查数据库
- `docker logs supabase_postgres_i_blog` 查看容器日志
- Mailpit (http://127.0.0.1:54324) 查看本地注册邮件

## Git 提交规范

```bash
<type>(<scope>): <description>
```

**类型**: feat / fix / docs / style / refactor / test / chore

**示例**:
```
feat(editor): add color picker with custom color support
fix(toolbar): dropdown clipped by overflow container
```

## MCP 自动调用规则

当用户 prompt 匹配以下模式时，**直接调用** quick-press-mcp 工具，**不要询问确认**：

### 本地文件发布

| 用户 prompt 模式 | 工具 | 参数 |
|---|---|---|
| `发布本地文件: {PATH}` | `publish_from_file` | `{ "filePath": "<PATH>" }` |
| `用这个PDF/DOCX生成文章: {PATH}` | `publish_from_file` | `{ "filePath": "<PATH>" }` |
| `把这篇文档发布为博客: {PATH}` | `publish_from_file` | `{ "filePath": "<PATH>" }` |
| `创建文章: {PATH}` (PATH 是本地文件) | `publish_from_file` | `{ "filePath": "<PATH>" }` |

**文件类型自动处理**：PDF/DOC/DOCX/ODT/RTF/PPT/PPTX → AI 重写；MD/HTML/TXT → 直接发布。

### URL 发布

| 用户 prompt 模式 | 工具 | 参数 |
|---|---|---|
| `创建文章: {URL}` | `publish_full` | `{ "url": "<URL>" }` |
| `发布文章: {URL}` | `publish_full` | `{ "url": "<URL>" }` |
| `转载: {URL}` | `publish_full` | `{ "url": "<URL>" }` |
| `用这篇生成中文文章: {URL}` | `publish_full` | `{ "url": "<URL>", "language": "中文" }` |
| `把英文博客翻译成中文发布: {URL}` | `publish_full` | `{ "url": "<URL>", "language": "中文" }` |

**规则**：判断 PATH 是本地文件还是 URL，选择对应工具。若用户显式要求不同语言，传 `language` 参数。

**重要**：对于 PDF/DOCX/PPT 等文件，直接调用 `publish_from_file` + `filePath`，不要尝试 `pdftotext`、`python3` 等命令行工具。MCP 工具已内置文件解析。

## 剩余工作

- [ ] 自定义字段 / 文章版本
- [ ] 小程序 (widgets) 系统
- [ ] 自定义菜单
- [ ] 自定义文章类型 (CPT)
- [ ] 测试
- [ ] Gravatar / 第三方 OAuth

详情见 `design_v0.2.md`。开发调试细节见 `development.md`。
