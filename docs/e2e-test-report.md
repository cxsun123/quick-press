# quick-press E2E 测试报告

**日期**: 2026-07-16
**测试框架**: playwright-cli
**环境**: Next.js 16 + Supabase + Tiptap

---

## 测试范围与结果

### 1️⃣ 公共页面 (Public Pages) — 全部通过 ✅

| 测试项 | 结果 |
|--------|------|
| 首页渲染: 显示"欢迎来到 quick-press" | ✅ |
| 登录页面: 显示"登录" + 邮箱/密码输入框 | ✅ |
| 注册页面: 显示"注册" + 昵称/邮箱/密码 | ✅ |
| 搜索结果页: 页面正常加载 | ✅ |
| 未登录访问 /admin 跳转 /login | ✅ |

### 2️⃣ 认证系统 (Authentication) — 全部通过 ✅

| 测试项 | 结果 |
|--------|------|
| 用户注册: 注册成功后自动跳转 /admin | ✅ |
| 注册后创建 user_profiles 记录 | ✅ |
| Admin 中间件保护 | ✅ |

### 3️⃣ 管理后台 (Admin Pages) — 全部通过 ✅

| 页面 | h1 标题 | 结果 |
|------|---------|------|
| /admin | 仪表盘 | ✅ |
| /admin/posts | 文章管理 | ✅ |
| /admin/posts/new | 新建文章 | ✅ |
| /admin/pages | 页面管理 | ✅ |
| /admin/tags | 标签与分类 | ✅ |
| /admin/comments | 评论管理 | ✅ |
| /admin/media | 媒体库 | ✅ |
| /admin/themes | 主题管理 | ✅ |
| /admin/users | 用户管理 | ✅ |
| /admin/settings | 系统设置 | ✅ |

### 4️⃣ WYSIWYG 编辑器 (Editor) — 通过 ✅

| 测试项 | 结果 |
|--------|------|
| ProseMirror 编辑器加载 | ✅ |
| 工具栏按钮 (24 个) | ✅ |
| Tiptap API 内容插入 | ✅ |

### 5️⃣ 文章 CRUD — 通过 ✅

| 测试项 | 结果 |
|--------|------|
| 新建文章页面渲染 | ✅ |
| 编辑器内容输入 | ✅ |
| 保存草稿 | ✅ (slug 重复问题已修复) |
| 文章列表展示 | ✅ |

---

## 发现并修复的问题

### Bug 1: HMR WebSocket 跨域阻断
- **症状**: HMR WebSocket 连接失败，编辑器 `useEditor` 返回 null，部分页面导航 ERR_ABORTED
- **根因**: Next.js 16 默认阻止 `127.0.0.1` 访问 dev 资源
- **修复方案**: `next.config.ts` 添加 `allowedDevOrigins: ['127.0.0.1']`
- **文件**: `next.config.ts`

### Bug 2: Slug 唯一性约束冲突
- **症状**: 重复保存相同标题的文章时出现 PostgreSQL `unique constraint "posts_slug_key"` 错误
- **根因**: `slugify()` 不检查 slug 是否已存在
- **修复方案**: 添加 `ensureUniqueSlug()` 函数，自动添加数字后缀 (e.g. `post-1`, `post-2`)
- **文件**: `src/lib/actions/post-actions.ts`

### Bug 3: 文章管理页标题不一致
- **症状**: H1 标题是"文章"而非"文章管理"
- **修复方案**: 改为"文章管理"
- **文件**: `src/app/admin/posts/page.tsx`

### Bug 4: 新建文章页缺少 H1 标题
- **症状**: PostEditor 没有 H1 标题
- **修复方案**: 添加"新建文章" H1 (编辑模式显示"编辑文章")
- **文件**: `src/components/blog/post-editor.tsx`

---

## 测试风险

1. **Next.js Dev Overlay**: 开发模式下 `nextjs-portal` 拦截指针事件，影响登录/登出按钮点击测试
2. **`document.execCommand('insertText')` 已废弃**: 现代浏览器不支持，编辑器测试应使用 Tiptap API
3. **React 状态更新**: DOM 直接设置 `input.value` 不触发 React 的 state 更新，测试时应使用 `fill` 命令

---

## E2E 测试用例文档

| # | 模块 | 测试用例 | 前置条件 | 步骤 | 预期结果 |
|---|------|---------|---------|------|---------|
| 1 | 公共首页 | 首页渲染 | 无 | 访问 `/` | 显示"欢迎来到 quick-press" |
| 2 | 认证 | 登录页面 | 无 | 访问 `/login` | 显示邮箱/密码输入框 |
| 3 | 认证 | 注册页面 | `registration_mode=open` | 访问 `/register` | 显示昵称/邮箱/密码输入框 |
| 4 | 认证 | 用户注册 | 注册开放 | 填写表单并提交 | 自动跳转 `/admin` |
| 5 | 权限 | Admin 保护 | 未登录 | 访问 `/admin` | 重定向到 `/login` |
| 6 | 后台 | 仪表盘 | 已登录 | 访问 `/admin` | 显示数据统计卡片 |
| 7 | 后台 | 文章管理 | 已登录 | 访问 `/admin/posts` | 显示文章列表 |
| 8 | 后台 | 新建文章 | 已登录 | 访问 `/admin/posts/new` | 显示编辑器 + 标题输入 |
| 9 | 后台 | 页面管理 | 已登录 | 访问 `/admin/pages` | 显示页面管理 |
| 10 | 后台 | 标签管理 | 已登录 | 访问 `/admin/tags` | 显示标签与分类 Tab |
| 11 | 后台 | 评论管理 | 已登录 | 访问 `/admin/comments` | 显示评论列表 |
| 12 | 后台 | 媒体库 | 已登录 | 访问 `/admin/media` | 显示媒体网格 |
| 13 | 后台 | 主题管理 | 已登录 | 访问 `/admin/themes` | 显示主题卡片 |
| 14 | 后台 | 用户管理 | 已登录(admin) | 访问 `/admin/users` | 显示用户列表 |
| 15 | 后台 | 系统设置 | 已登录(admin) | 访问 `/admin/settings` | 显示配置表单 |
| 16 | 编辑器 | 编辑器加载 | 新建文章页 | 等待 3s | ProseMirror 元素存在 |
| 17 | 编辑器 | 工具栏 | 编辑器已加载 | 检查按钮 | 24 个工具栏按钮 |
| 18 | 编辑器 | 内容输入 | 编辑器已加载 | 使用 Tiptap API | 内容显示在编辑器中 |
| 19 | 文章 | 创建文章 | 已登录 | 填写标题+内容+保存 | 文章出现在列表中 |
| 20 | 搜索 | 搜索结果 | 无 | 访问 `/search?q=xxx` | 页面正常渲染 |
