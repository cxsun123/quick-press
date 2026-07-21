# quick-press

基于 Next.js + Supabase + Tiptap 的现代化博客 CMS，对标 WordPress 功能集。

🌐 **在线示例**: <https://blog.tech616.me>


<a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>


## 功能特性

| 功能 | 状态 |
|------|------|
| ✅ WYSIWYG 编辑器（Tiptap） | ✅ 工具栏、颜色选择器、表格操作 |
| ✅ 文章 + 页面管理 | ✅ CRUD + Markdown 编辑器 |
| ✅ 标签 + 分类 | ✅ 自定义颜色、层级管理 |
| ✅ 评论系统 | ✅ 审核、删除、线程化 |
| ✅ 用户系统 | ✅ 注册/登录/角色权限（首个注册用户自动成为 admin） |
| ✅ 主题系统 | ✅ 5 套内置 + 自定义 CSS 上传 |
| ✅ 插件系统 | ✅ 插件注册机制 |
| ✅ 全文搜索 | ✅ PostgreSQL pg_trgm |
| ✅ 媒体库 | ✅ Supabase Storage |
| ✅ 深色模式 | ✅ 每套主题独立深色变体 |
| ✅ Docker 部署 | ✅ 一键启动 |
| ✅ 站点设置 | ✅ 博客名称、注册模式、主题风格可在后台修改 |
| ✅ AI 摘要 | ✅ OpenAI 兼容 API 自动提取摘要和关键字 |
| ✅ 密码保护 | ✅ 文章支持公开/私密/密码保护，分享链接 |
| ✅ MCP 集成 | ✅ Claude Code/Cursor 等 AI 客户端通过 MCP 协议管理文章 |

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **编辑器**: Tiptap (ProseMirror)
- **样式**: Tailwind CSS v4 + CSS 变量主题

## 快速部署（Vercel）

> 整个过程大约 **5–10 分钟**，无需懂代码，只要会复制粘贴。

### 部署准备

### Fork 项目 quick-press 到你自己的 GitHub
登录github并fork本项目。

### Supabase 的注册与初始化

#### 第 1 步：准备一个 Supabase 数据库（免费）

1. 打开 <https://supabase.com>，注册并登录。
2. 点击 **New Project**，填写项目名（如 `quick-press`），设置一个数据库密码，**密码记下来**。
3. 等待数据库初始化完成（约 1–2 分钟）。

#### 第 2 步：从 Supabase 管理界面获得三个变量

| 字段 | 填什么 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 进入项目后，在 Supabase 首页，点击顶部 Connect，弹出面板内复制该环境变量。 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 同上。 |
| `SUPABASE_SERVICE_ROLE_KEY` | 进入项目后，左菜单底部 Project Settings → API Keys，点击面板上方的标签 **"Legacy anon, service role API Keys"**，复制 service role 的值。 |

#### 第 3 步：初始化数据库表结构（只做一次）

两种途径任选其一：

**途径 A：Supabase Studio SQL Editor（推荐，无需安装 CLI）**

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 进入项目 → **SQL Editor**
2. 复制 [`supabase/init.sql`](../../supabase/init.sql) 的全部内容粘贴到编辑器
3. 点击 **Run** 执行

**途径 B：Supabase CLI（适合自动化流程）**

- 本地安装 [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)：

```bash
npm install supabase --save-dev 
# or: pnpm add -D supabase / yarn add -D supabase / bun add -D supabase
```

- 推送到远程项目：

```bash

supabase login

supabase projects list   # 第二列是 project-ref

supabase link --project-ref [project-ref]

supabase db push

```

> **💡 注意**：上述步骤**不需要运行 `supabase start`**（本地启动 Supabase 需下载约 1GB Docker 镜像），只装 CLI + `link` + `db push` 即可远程初始化，占用空间 < 50MB。


**验证 Storage bucket 是否创建成功**

CLI 或 SQL Editor 执行：

```bash

supabase db query "select * from storage.buckets;"

-- 或在 SQL Editor 中直接执行:  select * from storage.buckets;

```

预期输出两个 bucket：`media` 和 `themes`。

### Vercel部署

1. 打开 <https://vercel.com>，注册并登录。
2. 点击 **Add New → Project**，导入 quick-press 仓库。
3. 在 **Environment Variables** 中添加上一步的三个 Supabase 变量。
4. 部署。


### 首次使用设置

#### 1. 注册管理员账号

- 刚部署的项目默认开放注册。
- 访问 `https://[你的域名]/login` 自主注册。
- 🎯 **第一个注册成功的账号自动成为管理员**，无需手动配置。
- 🎯 之后再注册的账号默认为 `subscriber`。

#### 2. 关闭注册（推荐）

- 登录管理员账号，进入 **管理后台 → 设置**。
- 将**注册模式**改为**关闭注册**。

**完成！** 🎉  用管理员账号登录，开始使用 quick-press。

## 配置域名

### Vercel 绑定自己的域名

1. 进入 Vercel 的 quick-press 项目。
2. 点击菜单 **Domains**，点击 **Add Existing**。
3. 输入域名：

   - 如果使用 `www` 及根域名，请输入：
     ```
     www.xxx.xyz
     xxx.xyz
     ```
   - 如果使用子域名，请输入：
     ```
     [sub].xxx.xyz
     ```

4. 在 Domains 列表页面，打开新添加的域名，复制 **CNAME 的值（Value）**。
5. 进入域名服务器（如 Cloudflare），进入域名管理，增加 DNS 记录：

   | 字段 | 值 |
   |------|------|
   | Type | `CNAME` |
   | Name | 你的子域名（如 `www` 或 `[sub]`） |
   | Target | 上一步复制的 CNAME Value |

   保存后会立即生效。

6. 访问绑定的域名进行确认。

## 快速上手

### 角色权限

| 角色 | 级别 | 权限 |
|------|------|------|
| admin | 3 | 全部权限：管理用户、系统设置 |
| subscriber | 0 | 登录、评论、管理个人资料 |

admin 可在 **管理后台 → 用户管理** 中修改其他用户的角色。

如果开发注册，还可以有2个角色

| 角色 | 级别 | 权限 |
|------|------|------|=
| author | 1 | 创建/编辑自己的文章 |
| editor | 2 | 管理所有文章/页面/评论/标签/主题/媒体 |

### admin站点设置

admin 登录后可在 **管理后台 → 设置** 中修改：

- **站点标题**：博客名称，显示在前台左上角和浏览器标签栏
- **注册模式**：开放注册 / 邀请注册 / 关闭注册
- **外观模式**：亮色 / 暗色 / 跟随系统
- **主题风格**：5 套内置主题 + 自定义 CSS
- **AI 配置**：Provider URL、API Key、Model、内容截断长度
- **MCP API Key**：用于 Claude Code/Cursor 等 AI 客户端远程管理文章

修改站点标题后保存，页面自动刷新生效。

### admin AI 摘要配置

在 **管理后台 → 设置 → AI 配置** 中配置：

- **Provider URL**：OpenAI 兼容 API 地址（如 `https://api.openai.com/v1/chat/completions`）
- **API Key**：API 密钥，仅服务端存储，前端不可见
- **Model**：模型名称（如 `gpt-4o-mini`）
- **内容截断长度**：文章内容超过此长度时截断，防止超出模型上下文窗口（默认 100000 字符）

配置完成后，在文章编辑器的右侧面板点击"提取摘要"即可自动生成摘要和关键字。


### 内置主题

| 主题 | 风格 |
|------|------|
| 默认 | 蓝色系，清晰简洁 |
| 阅读 | 暖色调，衬线字体，优化阅读体验 |
| 开发者 | 冷灰色，代码友好 |
| 极简 | 干净简约，专注阅读 |
| 夜间 | 深蓝黑色，护眼模式 |

用户可在管理后台 → 主题中切换或上传自定义 CSS 主题。


### MCP 集成

quick-press 支持 [Model Context Protocol (MCP)](https://modelcontextprotocol.io)，允许 AI 客户端通过 MCP 协议管理文章。

#### 获取 MCP Key

在 **管理后台 → 设置 → MCP API Key** 中生成 Key。

#### 配置 Claude Code

编辑 `~/.claude/settings.json` 或项目根目录 `.mcp.json`：

```json
{
  "mcpServers": {
    "quick-press": {
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer sk-mcp-xxxxxxxxxxxx"
      }
    }
  }
}
```

#### 支持的 MCP 工具

| 工具 | 功能 |
|------|------|
| `create_draft` | 创建文章草稿 |
| `publish_post` | 发布或更新文章 |
| `list_posts` | 查看所有文章 |
| `get_post` | 获取文章详情 |
| `delete_post` | 删除文章 |
| `search_posts` | 搜索文章 |
| `get_stats` | 获取博客统计（文章数/评论数） |

### 文章可见度

编辑文章时，右侧面板的"可见度"区块支持：

| 级别 | 说明 |
|------|------|
| **公开** | 所有人可见，出现在首页/归档/搜索 |
| **私密** | 仅作者和管理员可见 |
| **密码保护** | 输入正确密码访问，可生成分享链接 |

文章列表支持按可见度筛选和批量修改可见度。


## 参与项目开发

### 前置条件

- Node.js 20+
- pnpm
- Supabase 项目（免费套餐即可）
- Clone本项目

  Clone项目到本地并在终端切换到项目根目录。

```text
git clone git@github.com:[你的-github-id]/quick-press.git

cd  quick-press

```

### 1. 配置环境变量

```bash
cp .env.example .env
```

在 `.env` 中填入 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =your-publishable-key
```

### 2. 初始化本地数据库

> 💡 `supabase start` 会下载约 1GB Docker 镜像并启动 PostgreSQL、Auth 等多个容器，占用 3–5GB 磁盘空间。如果只是远程部署不需要执行此步。

```bash

# 本地开发：启动 Supabase 并应用迁移
supabase start

supabase db reset

```

迁移会自动创建 `media` 和 `themes` 两个 Storage bucket。

### 3. 启动服务

```bash

pnpm install

pnpm dev

```

访问 http://localhost:3000

首次使用先注册账号，首个注册的用户自动成为 admin。之后注册的用户默认为 subscriber。



### Docker 部署

```bash
# 构建
docker build -t quick-press .

# 运行（自定义端口）
docker run -p 3000:3000 --env-file .env quick-press
```

或使用 docker-compose：

```bash
docker compose up -d
```

自定义端口：

```bash
PORT=8080 docker compose up -d
```

### 项目结构

```
quick-press/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/            # 管理后台
│   │   ├── (auth)/           # 登录/注册
│   │   ├── (public)/         # 前台页面
│   │   └── api/              # API 路由
│   ├── server/               # 服务端三层架构
│   │   ├── actions/          # Server Actions（薄封装）
│   │   ├── services/         # 业务逻辑
│   │   ├── repositories/     # 数据访问
│   │   ├── auth/             # 角色与权限
│   │   ├── utils/            # 工具函数
│   │   └── db/               # Supabase 客户端
│   ├── components/
│   │   ├── admin/            # 管理后台组件
│   │   ├── blog/             # 前台组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── models/               # 共享类型定义
│   ├── hooks/                # React Hooks
│   ├── plugins/              # 博客插件
│   └── lib/supabase/         # 浏览器端 Supabase 客户端
├── supabase/
│   ├── migrations/           # 数据库迁移（README + 后续变更）
│   │   └── README.md
│   └── init.sql              # 完整初始化 schema（新数据库使用）
├── Dockerfile
├── docker-compose.yml
├── development.md            # 开发补充文档（调试、数据库、FAQ）
├── design_v0.2.md           # 设计文档
└── README.md
```

### 文档

- [开发补充文档](development.md) — 调试指南、数据库迁移、CLI 速查、常见问题
- [设计文档](design_v0.2.md) — 完整的功能设计与数据模型

### 参考

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tiptap](https://tiptap.dev/)
- [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)

### 国际化（i18n）

界面使用 [next-intl](https://next-intl.dev) 进行国际化。支持的语言：

- `en` — 英文（**默认**）
- `zh` — 中文

语言通过 `NEXT_LOCALE` Cookie 解析（回退到 `Accept-Language` 请求头），**不会改变 URL**，
因此现有链接、API 路由和 Supabase 认证回调均不受影响。

- 通过站点页头与管理后台顶部的语言选择器切换语言（`src/components/locale-switcher.tsx`）。
- 翻译字典位于 `src/messages/{en,zh}.json`。
- 服务端组件使用 `getTranslations` / `getLocale`；客户端组件使用 `useTranslations` / `useLocale`。
- 编辑器工具栏同样本地化——`WysiwygEditor` 会接收当前 `locale`。

新增语言：在 `src/i18n/routing.ts` 的 `locales` 中添加，创建 `src/messages/<locale>.json`，
并补充 `localeNames` 即可。
