# quick-press — 开发补充文档

> 本文档涵盖本地调试、数据库管理、部署细节等 README 之外的内容。
> 快速入门请阅读 [README.zh-CN.md](README.zh-CN.md)。

## 服务拓扑

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
# 参考 supabase/migrations/README.md 了解迁移管理方式

# 应用到本地数据库
supabase db reset

# 查看当前完整 schema
supabase db dump --local
```

`supabase/migrations/` 目录下的迁移文件按时间戳顺序执行。
**不要**手动修改已应用过的迁移文件——创建新文件来变更。

---

## 部署补充

### 1.4 启用 pg_trgm 扩展

```bash
supabase db query "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### 1.5 配置 Auth 设置

在 Supabase Studio 远程 → **Authentication → Settings**：
- **Site URL**: `https://<vercel-domain>.vercel.app`
- **Redirect URLs**: 添加 `https://<vercel-domain>.vercel.app/**`
- 根据需要调整 `enable_signup` 等

### 1.6 创建 Storage bucket

```bash
# 通过 Supabase CLI
supabase storage create media --public

# 或通过 Studio：Storage → New bucket → 名称 media → 公开
```

### 1.7 插入默认数据

```sql
-- 如果 db push 未包含默认数据，手动执行
INSERT INTO site_config (key, value) VALUES
  ('site_title', 'quick-press'),
  ('site_description', 'A modern blog CMS'),
  ('registration_mode', 'open')
ON CONFLICT (key) DO NOTHING;
```

### 2.2 环境变量安全规则

`SUPABASE_SERVICE_ROLE_KEY` 绕过所有 RLS 策略，**绝不能**在前端代码中引用或暴露：

```typescript
// ❌ 错误：服务端 key 暴露给浏览器
const supabase = createBrowserClient(url, anonKey, serviceRoleKey);

// ✅ 正确：仅服务端使用
import { createAdminClient } from '@/server/db/client';
const adminClient = await createAdminClient(); // 内部使用 SUPABASE_SERVICE_ROLE_KEY
```

### 2.6 Vercel 环境变量配置截图指引

```
Vercel Dashboard → 选择项目
  → Settings
    → Environment Variables
      → Key:   NEXT_PUBLIC_SUPABASE_URL
      → Value: https://<project_ref>.supabase.co
      → Environments: Production, Preview, Development
      → Add

      → Key:   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      → Value: sb_publishable_xxx
      → Environments: Production, Preview, Development
      → Add

      → Key:   SUPABASE_SERVICE_ROLE_KEY
      → Value: eyJxxx...
      → Environments: Production, Preview（建议不勾选 Preview）
      → Add

      → Key:   NEXT_PUBLIC_SITE_TITLE
      → Value: quick-press
      → Environments: Production, Preview, Development
      → Add
```

### 3. Docker 部署（备用）

适用于自托管 VPS 或私有服务器：

```bash
# 构建并启动
docker compose up -d --build

# 指定端口（默认 3000）
PORT=8080 docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

确保 `.env` 文件包含生产 Supabase 凭据。

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
