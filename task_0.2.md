# i_blog 开发任务列表

## 项目信息

- **项目名称**：i_blog - 现代化博客 CMS
- **总工期**：~34 天
- **创建日期**：2026-07-15

---

## Phase 0：项目脚手架（2天）

### 0.1 项目初始化
- [ ] pnpm init，创建 `package.json`
- [ ] Next.js 16 初始化（App Router）
- [ ] TypeScript 配置（tsconfig.json）
- [ ] ESLint 配置
- [ ] Tailwind CSS v4 配置
- [ ] shadcn/ui 初始化（base-nova 风格）
- [ ] 全局样式（globals.css，含 CSS 变量 + dark mode）
- [ ] `.env.example` + 环境变量文档
- **验收标准**：`pnpm dev` 启动成功，页面正常显示

### 0.2 Supabase 配置
- [ ] Supabase 项目创建
- [ ] 数据库初始化（init.sql）
- [ ] Supabase 客户端 SDK 安装配置
- [ ] RLS 策略初始设置
- [ ] Storage bucket 创建（media）
- **验收标准**：服务端/客户端均可连接 Supabase

### 0.3 Docker + 部署配置
- [ ] Dockerfile（多阶段构建）
- [ ] docker-compose.yml
- [ ] .dockerignore
- [ ] PM2 配置（ecosystem.config.js）
- **验收标准**：`docker compose up` 启动成功

### 0.4 基础布局
- [ ] RootLayout（全局 provider：theme、supabase）
- [ ] ThemeProvider（light/dark/system）
- [ ] PublicLayout（header + main + footer）
- [ ] AdminLayout（侧边栏 + 导航）
- [ ] AuthLayout（居中登录表单）
- **验收标准**：三种布局均可正常渲染

---

## Phase 1：内容模型（5天）

### 1.1 数据库 Schema
- [ ] posts 表（含 RLS）
- [ ] pages 表（含 RLS）
- [ ] tags + post_tags 表
- [ ] categories + post_categories 表
- [ ] comments + comment_likes 表
- [ ] user_profiles 表
- [ ] site_config 表
- [ ] media 表
- [ ] plugins + themes 表
- [ ] invitations 表
- [ ] post_revisions 表
- [ ] 全文搜索索引（pg_trgm）
- [ ] 所有 RLS 策略
- **验收标准**：`supabase/init.sql` 完整可执行

### 1.2 数据库类型定义
- [ ] `src/lib/db/types.ts` — 所有表对应的 TypeScript 类型
- [ ] Server Action 返回类型（ActionResult）
- [ ] 错误码枚举
- **验收标准**：类型定义完整，编译通过

### 1.3 Server Actions — Posts
- [ ] `createPost`（含 slug 自动生成）
- [ ] `updatePost`
- [ ] `deletePost`（软删除）
- [ ] `getPost`（公开 + 管理）
- [ ] `listPosts`（公开 + 管理，含分页）
- [ ] `publishPost` / `unpublishPost`
- **验收标准**：Post CRUD 完整可用

### 1.4 前端 — 文章列表
- [ ] 首页文章列表（分页 + 置顶）
- [ ] 文章卡片组件（PostCard）
- [ ] 文章详情页（含 Markdown 渲染）
- [ ] 管理后台文章列表（表格 + 搜索）
- **验收标准**：文章可浏览、可阅读

### 1.5 前端 — 管理后台框架
- [ ] AdminLayout（侧边栏导航）
- [ ] 仪表盘页面（统计概览）
- [ ] 文章管理页面（表格）
- [ ] 新建/编辑文章页面（骨架）
- **验收标准**：管理后台可导航

---

## Phase 2：编辑器集成（5天）

### 2.1 编辑器核心
- [ ] 拷贝适配 `extensions.ts`（从 markdown_visual_editor）
- [ ] 拷贝适配 `wysiwyg-editor.tsx`
- [ ] 添加 Markdown 扩展（tiptap-markdown）
- [ ] 配置 Highlight（multicolor）
- [ ] 配置 TextStyle + Color（字体颜色）
- [ ] 配置 Mathematics（LaTeX 公式）
- [ ] 内容同步逻辑（Markdown ↔ Tiptap）
- **验收标准**：编辑器可正常初始化，输入内容

### 2.2 工具栏
- [ ] 拷贝适配 `toolbar.tsx`
- [ ] 段落格式下拉（H1-H6、正文、引用、代码块）
- [ ] 字符格式按钮（粗体、斜体、删除线、行内代码、高亮）
- [ ] 插入功能（链接、图片、表格、分割线）
- [ ] 列表按钮（有序、无序、任务列表）
- [ ] 撤销/重做
- [ ] 表格操作菜单（删除表、行列操作、合并/拆分）
- **验收标准**：工具栏所有按钮功能正常

### 2.3 颜色选择器
- [ ] 拷贝适配 `color-picker-panel.tsx`
- [ ] 字体颜色选择器
- [ ] 背景颜色选择器
- [ ] 自定义颜色（原生 `<input type="color">`）
- **验收标准**：颜色选择器可用

### 2.4 NodeViews
- [ ] 拷贝适配 `heading-node-view.tsx`
- [ ] 拷贝适配 `blockquote-node-view.tsx`
- [ ] 拷贝适配 `code-block-node-view.tsx`
- [ ] 拷贝适配 `image-node-view.tsx`
- [ ] 拷贝适配 `link-node-view.tsx`
- [ ] 拷贝适配 `mermaid-node-view.tsx`
- [ ] 注册所有 NodeViews
- **验收标准**：所有 NodeView 正常渲染

### 2.5 编辑器插件
- [ ] 拷贝适配 `link-double-click.ts`
- [ ] 拷贝适配表格右键菜单
- [ ] Emoji 解析（node-emoji）
- [ ] 编辑器快捷键
- **验收标准**：双击链接/表格右键/emoji 正常

### 2.6 编辑器与博客集成
- [ ] PostEditor 整合编辑器（模式切换）
- [ ] 内容同步（编辑器 ↔ 表单 state）
- [ ] 图片上传对接 Supabase Storage
- [ ] 自动保存草稿
- [ ] 编辑器样式适配博客主题
- **验收标准**：编辑器在博客中完整可用

---

## Phase 3：用户系统 + 评论（4天）

### 3.1 认证
- [ ] 注册页面 + Server Action
- [ ] 登录页面 + Server Action
- [ ] 登出
- [ ] 密码找回
- [ ] 邮箱验证（可选）
- **验收标准**：注册/登录/登出流程完整

### 3.2 用户资料
- [ ] 个人资料页面（查看 + 编辑）
- [ ] 头像上传（对接 Supabase Storage）
- [ ] 公开作者页面
- **验收标准**：用户可编辑资料，作者页正常

### 3.3 角色权限
- [ ] 角色中间件（Admin/Editor/Author/Subscriber）
- [ ] 管理后台权限控制
- [ ] API 权限校验
- **验收标准**：不同角色看到不同界面

### 3.4 注册控制
- [ ] site_config 添加 `registration_mode`
- [ ] 邀请码生成/管理
- [ ] 注册页面根据模式调整
- **验收标准**：open/invite/closed 三种模式正常

### 3.5 评论系统
- [ ] 评论提交 Server Action
- [ ] 评论列表渲染（递归树形）
- [ ] 评论审核（通过/垃圾/删除）
- [ ] 评论管理后台
- [ ] 评论点赞
- **验收标准**：评论可提交、查看、审核

---

## Phase 4：Pages + Tags + Categories（3天）

### 4.1 Pages
- [ ] Pages CRUD Server Actions
- [ ] 页面编辑器（复用 PostEditor）
- [ ] 父子页面管理
- [ ] 页面路由
- **验收标准**：页面可创建、编辑、浏览

### 4.2 Tags / Categories
- [ ] Tags CRUD Server Actions
- [ ] Categories CRUD（树形）
- [ ] 标签/分类管理页面
- [ ] 标签/分类归档页面
- **验收标准**：标签/分类可管理、可归档浏览

### 4.3 文章编辑器整合
- [ ] 文章编辑页整合标签选择
- [ ] 文章编辑页整合分类选择
- **验收标准**：新建/编辑文章可选择标签和分类

---

## Phase 5：管理后台完善（4天）

### 5.1 仪表盘
- [ ] 文章统计（总数、发布数、草稿数）
- [ ] 评论统计
- [ ] 最近文章列表
- [ ] 最近评论列表
- **验收标准**：仪表盘显示统计数据

### 5.2 评论管理
- [ ] 评论列表（含状态筛选）
- [ ] 评论批量操作（通过/垃圾/删除）
- [ ] 评论详情
- **验收标准**：评论管理页面完整

### 5.3 媒体库
- [ ] 媒体上传组件
- [ ] 媒体列表（网格）
- [ ] 媒体编辑（alt 文字、替换）
- [ ] 媒体删除
- **验收标准**：媒体可上传、浏览、管理

### 5.4 用户管理（Admin only）
- [ ] 用户列表
- [ ] 编辑用户角色
- [ ] 删除用户
- **验收标准**：Admin 可管理用户

### 5.5 系统设置
- [ ] 站点信息设置（标题、副标题、logo）
- [ ] 注册设置（模式切换）
- [ ] 评论设置（审核开关）
- **验收标准**：设置项可保存、生效

### 5.6 个人设置
- [ ] 个人资料编辑
- [ ] 密码修改
- [ ] 主题偏好（light/dark/system）
- **验收标准**：个人设置可保存

---

## Phase 6：搜索 + 媒体（3天）

### 6.1 全文搜索
- [ ] pg_trgm 索引确认
- [ ] 搜索 API / Server Action
- [ ] 搜索结果页面
- [ ] 搜索高亮
- **验收标准**：搜索返回正确结果

### 6.2 媒体上传集成
- [ ] 编辑器图片上传（拖拽 + 粘贴 + 按钮）
- [ ] 媒体库选择器（插入已有媒体）
- [ ] 上传进度指示
- **验收标准**：编辑器图片上传可用

---

## Phase 7：插件 + 主题系统（5天）

### 7.1 插件系统核心
- [ ] `PluginAPI.ts` — 插件注册机制
- [ ] 插件生命周期（install/activate/deactivate/uninstall）
- [ ] 扩展点实现（toolbar/editor/routes/settings）
- [ ] 插件管理页面
- **验收标准**：可安装、激活、停用插件

### 7.2 主题系统
- [ ] CSS 变量体系（40+ 变量）
- [ ] 主题注册表 + 管理页面
- [ ] 主题切换机制
- [ ] 默认主题（light + dark）
- **[ ] 示例 starter-blog 主题**（复刻 tailwind-nextjs-starter-blog 样式）
  - Prose 排版
  - 代码高亮配色
  - 文章列表卡片样式
  - 布局组件
- **验收标准**：主题可安装、切换，前端样式跟随变化

---

## Phase 8：测试 + 部署（3天）

### 8.1 测试
- [ ] 编辑器功能测试
- [ ] 内容 CRUD 测试
- [ ] 评论流程测试
- [ ] 响应式测试（移动端 + 桌面端）
- **验收标准**：核心功能无 Bug

### 8.2 部署
- [ ] Docker 构建验证
- [ ] 部署文档
- [ ] CI 配置（ESLint + TypeScript）
- **验收标准**：可 Docker 部署上线

---

## 任务统计

| Phase | 内容 | 任务数 | 工期 |
|-------|------|--------|------|
| 0 | 项目脚手架 | ~15 | 2天 |
| 1 | 内容模型 | ~25 | 5天 |
| 2 | 编辑器集成 | ~30 | 5天 |
| 3 | 用户系统 + 评论 | ~20 | 4天 |
| 4 | Pages + Tags + Categories | ~12 | 3天 |
| 5 | 管理后台完善 | ~20 | 4天 |
| 6 | 搜索 + 媒体 | ~8 | 3天 |
| 7 | 插件 + 主题系统 | ~12 | 5天 |
| 8 | 测试 + 部署 | ~8 | 3天 |
| **总计** | | **~150** | **~34天** |
