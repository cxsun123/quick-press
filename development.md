# i_blog — 开发与部署指南

## 本地开发环境

### 前置依赖

- **Node.js** >= 20（推荐 22 LTS）
- **pnpm** >= 11.13（`npm install -g pnpm`）
- **Docker Desktop**（Supabase 本地服务依赖）
- **Supabase CLI** >= 2.109（`brew install supabase/tap/supabase`）

### 首次搭建

```bash
# 1. 安装依赖
pnpm install

# 2. 初始化 Supabase（已初始化，首次项目需执行）
supabase init

# 3. 启动 Supabase 本地服务（PostgreSQL + Auth + Storage + Studio）
supabase start

# 4. 启动 Next.js 开发服务器（默认端口 3000）
pnpm dev
```

首次 `supabase start` 需要下载约 1GB Docker 镜像，后续启动秒级完成。

### 服务拓扑

```
┌──────────────────────────────────────────────────┐
│  pnpm dev (localhost:3000)                        │
│  ┌────────────────────────────────────────────┐  │
│  │ Next.js Dev Server                         │  │
│  │  ├─ Server Components (SSR, Server Actions) │  │
│  │  └─ Client Components (CSR, Hooks)          │  │
│  └──────────────┬─────────────────────────────┘  │
│                 │ http://127.0.0.1:54321           │
│  ┌──────────────▼─────────────────────────────┐  │
│  │ Supabase Local Stack (Docker)              │  │
│  │  ├─ PostgreSQL :54322                      │  │
│  │  ├─ GoTrue (Auth)                          │  │
│  │  ├─ PostgREST (REST API)                   │  │
│  │  ├─ Realtime                               │  │
│  │  ├─ Storage (S3-compatible)                │  │
│  │  └─ Studio GUI :54323                      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### 日常开发流程

```bash
# 1. 确保 Docker 运行中

# 2. 启动 Supabase 本地服务
supabase start

# 3. 启动 Next.js 开发服务器
pnpm dev

# 4. 打开浏览器
open http://localhost:3000
```

`pnpm dev` 支持热更新（HMR），修改代码后浏览器自动刷新。

### 查看服务状态

```bash
# Supabase 各服务是否正常运行
supabase status

# 运行的 Docker 容器
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Next.js 开发服务器日志（运行中时查看）
# .next/dev/logs/next-development.log
```

### 本地服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| Next.js 开发服务器 | http://localhost:3000 | 博客前端 + 管理后台 |
| Supabase Studio | http://127.0.0.1:54323 | 数据库管理、SQL 编辑器、表数据浏览 |
| Supabase REST API | http://127.0.0.1:54321/rest/v1 | Supabase 自动生成的 REST 接口 |
| Supabase GraphQL | http://127.0.0.1:54321/graphql/v1 | GraphQL 接口 |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | 直连数据库 |
| Mailpit | http://127.0.0.1:54324 | 本地邮件测试（注册确认邮件等） |

---

## 调试

### 浏览器调试

1. 打开 Chrome DevTools（F12）
2. **Network 面板**：查看 Server Action 请求（fetch POST /_next/...）
3. **React DevTools**：安装 Chrome 扩展，检查组件状态和 props
4. **Console**：查看客户端错误日志

### 日志查看

```bash
# 开发服务器日志
# 输出在终端中，实时显示请求、错误、警告

# 查看完整的 Next.js 日志文件
tail -f .next/dev/logs/next-development.log

# Docker 容器日志
docker logs supabase_studio_i_blog
docker logs supabase_auth_i_blog
docker logs supabase_postgres_i_blog
```

### 数据库调试

```bash
# 通过 Supabase CLI 执行 SQL
supabase db query "SELECT * FROM posts WHERE status = 'published';"

# 通过 Studio 可视化浏览
open http://127.0.0.1:54323  # → Table Editor

# 直连 PostgreSQL（需要 psql）
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# 查看数据库 schema
supabase db dump --local | less
```

### Server Actions 调试

Server Actions 是 Next.js 服务端函数，调试方式：

1. **浏览器 Network 面板**：过滤 `fetch` 请求，查看 Server Action 的请求/响应
2. **终端输出**：`pnpm dev` 终端会打印服务端 `console.log`
3. **断点调试**：在 VS Code 中使用 `--inspect`

```bash
# VS Code 调试模式（需配置 launch.json）
pnpm dev --inspect
```

### 常见问题排查

| 现象 | 排查步骤 |
|------|---------|
| 页面 500 错误 | 检查终端输出，查看具体错误堆栈 |
| 登录失败 | 查看 Mailpit http://127.0.0.1:54324 确认邮件 |
| 数据不显示 | `supabase db query "SELECT * FROM posts;"` |
| 页面白屏（CSR） | 浏览器 Console 查看 JS 错误 |
| API 返回 401 | 确认 `.env.local` 中 anon key 正确 |

---

## 数据库变更

所有 schema 变更通过 Supabase 迁移管理：

```bash
# 创建新的迁移文件
supabase migration new <description>

# 编辑 supabase/migrations/<timestamp>_<description>.sql

# 应用到本地数据库
supabase db reset

# 查看当前完整 schema
supabase db dump --local
```

`supabase/migrations/` 目录下的迁移文件按时间戳顺序执行。
**不要**手动修改已应用过的迁移文件——创建新文件来变更。

---

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # 博客前端页面（SSR）
│   ├── (auth)/             # 登录/注册
│   ├── admin/              # 管理后台（CSR）
│   └── api/                # API 路由
├── server/                 # 服务端三层架构
│   ├── actions/            # Server Actions（薄封装→调用 services→revalidate）
│   ├── services/           # 业务逻辑编排
│   ├── repositories/       # 数据访问（直接调 Supabase）
│   ├── auth/               # 角色与权限
│   ├── utils/              # 工具函数（slugify 等）
│   └── db/                 # Supabase 客户端
├── components/
│   ├── blog/               # 博客前端组件
│   ├── admin/              # 管理后台组件
│   └── ui/                 # shadcn/ui 组件
├── models/                 # 共享类型定义
├── hooks/                  # React Hooks
├── plugins/                # 插件
├── styles/                 # 全局样式
└── lib/supabase/client.ts  # 浏览器端 Supabase 客户端
```

---

## 部署指南

项目使用两套独立服务：**Vercel**（Next.js 前端 + API）+ **Supabase**（数据库 + Auth + Storage）。

### 1. Supabase 生产部署

#### 1.1 创建生产项目

1. 访问 [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. 填写项目名称、数据库密码、选择区域（建议选新加坡或日本以降低延迟）
3. 创建成功后，在 **Project Settings → API** 中查看：
   - **Project URL**（`https://<project_ref>.supabase.co`）
   - **anon public key**（`sb_publishable_xxx`）
   - **service_role key**（`eyJxxx`，保密）

#### 1.2 关联 CLI 与远程项目

```bash
# 关联远程 Supabase 项目
supabase link --project-ref <project_ref>

# 验证关联
supabase projects list
```

`project_ref` 即 Project URL 中的子域名部分（如 `qadhixjbcttztndyyjdz`）。

#### 1.3 推送数据库 schema

```bash
# 将所有本地迁移应用到远程数据库
supabase db push

# 验证远程 schema
supabase db dump --linked
```

> `supabase db push` 会按时间戳顺序执行 `supabase/migrations/` 下所有未应用过的迁移。
> **生产环境**：部署时运行 `supabase db push` 推送迁移即可。

#### 1.4 启用 pg_trgm 扩展

```bash
supabase db query "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

#### 1.5 配置 Auth 设置

在 Supabase Studio 远程 → **Authentication → Settings**：
- **Site URL**: `https://<vercel-domain>.vercel.app`
- **Redirect URLs**: 添加 `https://<vercel-domain>.vercel.app/**`
- 根据需要调整 `enable_signup` 等

#### 1.6 创建 Storage bucket

```bash
# 通过 Supabase CLI
supabase storage create media --public

# 或通过 Studio：Storage → New bucket → 名称 media → 公开
```

#### 1.7 插入默认数据

```sql
-- 如果 db push 未包含默认数据，手动执行
INSERT INTO site_config (key, value) VALUES
  ('site_title', 'i_blog'),
  ('site_description', 'A modern blog CMS'),
  ('registration_mode', 'open')
ON CONFLICT (key) DO NOTHING;
```

---

### 2. Vercel 部署

#### 2.1 连接 Git 仓库

1. 登录 [vercel.com](https://vercel.com)
2. 点击 **Add New → Project**
3. 导入 `i_blog` 的 Git 仓库（GitHub / GitLab / Bitbucket）
4. Framework preset 自动选择 **Next.js**

#### 2.2 配置环境变量

在 Vercel 项目设置 → **Environment Variables** 中逐项添加（不要提交到 Git）：

| 变量 | 示例值 | 说明 | 来源 |
|------|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qadhixjbcttztndyyjdz.supabase.co` | Supabase 项目 URL | Supabase Dashboard → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_bP42nWtMK5viSFiZdp9jtQ_C1kSlzy7` | 公开 anon key（可暴露给前端） | Supabase Dashboard → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 服务角色密钥（**严禁**暴露给前端，仅服务端使用） | Supabase Dashboard → API |
| `NEXT_PUBLIC_SITE_TITLE` | `i_blog` | 站点标题，显示在浏览器标签栏 | 自定义 |

**各变量说明：**

- **`NEXT_PUBLIC_SUPABASE_URL`** — 所有 Supabase 客户端请求的目标地址。以 `https://` 开头，`.supabase.co` 结尾。前缀 `NEXT_PUBLIC_` 表示此变量在浏览器端也可访问。
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — Supabase 的公开 API key。前端 `createBrowserClient()` 和服务器端 `createClient()` 均使用此 key。RLS 策略控制访问权限，此 key 本身没有直接数据访问能力。
- **`SUPABASE_SERVICE_ROLE_KEY`** — 绕过所有 RLS 策略的管理员 key。只在服务端使用（`createAdminClient()`），**绝不能**在前端代码中引用或暴露。如果泄露，攻击者可直接操作数据库。
- **`NEXT_PUBLIC_SITE_TITLE`** — 纯前端变量，用于 `<title>` 标签和页面标题显示。

**重要安全规则：**

```typescript
// ❌ 错误：服务端 key 暴露给浏览器
const supabase = createBrowserClient(
  url,
  anonKey,
  // 这里绝对不能传 serviceRoleKey
);

// ✅ 正确：仅服务端使用
import { createAdminClient } from '@/server/db/client';
const adminClient = await createAdminClient(); // 内部使用 SUPABASE_SERVICE_ROLE_KEY
```

#### 2.3 部署

- **自动部署**：推送代码到 `main` 分支自动触发
- **预览部署**：创建 PR 时自动生成预览 URL，可用于测试
- **手动部署**：

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署到生产
vercel --prod

# 部署到预览
vercel
```

#### 2.4 构建配置

默认 Next.js 构建即可。如需自定义，创建 `vercel.json`：

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
```

#### 2.5 域名绑定（可选）

1. 在 Vercel 项目 → **Settings → Domains**
2. 输入自定义域名（如 `blog.example.com`）
3. 按提示配置 DNS（CNAME 指向 `cname.vercel-dns.com`）

#### 2.6 Vercel 环境变量配置截图指引

```
Vercel Dashboard → 选择项目
  → Settings
    → Environment Variables
      → Key:   NEXT_PUBLIC_SUPABASE_URL
      → Value: https://qadhixjbcttztndyyjdz.supabase.co
      → Environments: Production, Preview, Development
      → Add

      → Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY
      → Value: sb_publishable_xxx
      → Environments: Production, Preview, Development
      → Add

      → Key:   SUPABASE_SERVICE_ROLE_KEY
      → Value: eyJxxx...
      → Environments: Production, Preview（建议不要勾选 Preview）
      → Add

      → Key:   NEXT_PUBLIC_SITE_TITLE
      → Value: i_blog
      → Environments: Production, Preview, Development
      → Add
```

---

### 3. Docker 部署（备用）

适用于自托管 VPS 或私有服务器：

```bash
# 构建并启动
docker-compose up -d --build

# 指定端口（默认 3000）
PORT=8080 docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

确保 `.env` 文件包含生产 Supabase 凭据（与 Vercel 相同的变量）。

---

## 环境变量

项目使用三个环境文件（均不提交到 Git，`.env.local` 已配置为本地 Supabase）：

| 文件 | 用途 | 优先级 |
|------|------|--------|
| `.env.local` | 本地开发（本地 Supabase） | 最高 |
| `.env.production` | 模拟生产构建（远程 Supabase） | `next build` 时 |
| `.env` | 默认配置 / Docker 部署 | 最低 |

文件加载优先级（高 → 低）：`.env.local` > `.env.production` > `.env`

**Vercel 部署时不需要这些文件**，环境变量在 Dashboard 中配置。

---

## CLI 命令速查

### Next.js

```bash
pnpm dev           # 开发服务器（HMR）
pnpm build         # 生产构建 + TypeScript 类型检查
pnpm start         # 启动生产服务器
pnpm lint          # 代码检查（ESLint）
```

### Supabase

```bash
supabase start                   # 启动本地所有服务
supabase stop                    # 停止本地所有服务
supabase status                  # 查看运行状态
supabase restart                 # 重启服务

supabase db reset                # 重置本地数据库（重新运行所有迁移）
supabase db push                 # 推送本地迁移到远程
supabase db pull                 # 从远程拉取 schema 到本地

supabase migration new <name>    # 创建新迁移文件
supabase migration list          # 列出所有迁移文件
supabase migration apply         # 手动应用未执行的迁移

supabase db dump --local         # 导出完整本地 schema
supabase db dump --linked        # 导出完整远程 schema
supabase db dump --local --data-only  # 仅导出数据

supabase link --project-ref <id> # 关联远程项目
supabase unlink                  # 解除关联
supabase projects list           # 查看关联的项目
supabase db query "SELECT ..."   # 执行 SQL 查询

supabase storage create <name> --public  # 创建公开 bucket
supabase storage ls               # 列出所有 bucket
```

---

## 常见问题

**Q: `supabase start` 下载很慢**
A: 首次启动需下载约 1GB Docker 镜像，后续会缓存。可提前 `docker pull` 需要的镜像：
```bash
docker pull supabase/postgres:17.0.0
docker pull supabase/gotrue:latest
```

**Q: 开发服务器连接 Supabase 失败（401/500）**
A: 检查以下步骤：
1. `supabase status` 确认服务运行中
2. `.env.local` 中的 URL 和 key 与 `supabase status` 输出一致
3. 重启 Supabase：`supabase stop && supabase start`

**Q: 数据库迁移冲突**
A: 不要手动修改已应用的迁移文件。创建新的迁移文件来变更 schema：
```bash
supabase migration new add_comment_notifications
# 编辑生成的 .sql 文件
supabase db reset
```

**Q: 如何切换回远程 Supabase**
A: 将 `.env.local` 内容替换为 `.env.production` 中的远程凭据。

**Q: Server Action 返回 500 但终端无日志**
A: 确认 Server Action 函数前有 `'use server'` 指令。检查 `.env.local` 中的 Supabase URL 和 key 是否正确。

**Q: Vercel 部署后页面空白**
A: 检查 Vercel 部署日志（Deployment → Functions Logs），确认环境变量已正确配置。常见原因：`NEXT_PUBLIC_SUPABASE_URL` 未配置或拼写错误。
