# Editor 包迁移任务列表

## 状态说明
- [ ] 待开始
- [x] 已完成
- [-] 跳过

---

## Part 1：改造 markdown_visual_editor

- [x] 1.1 创建 `src/components/editor/index.ts` barrel export
- [x] 1.2 修改 `package.json`（name/exports/peerDependencies/缺失依赖）
- [x] 1.3 修复 `@/` import → 相对路径（6 处）
- [x] 1.4 添加 `.npmrc`（shamefully-hoist + public-hoist-pattern）
- [x] 1.5 验证 editor 项目独立 build 通过
- [x] 1.6 发布 `@chengxinsun26/editor@0.1.0` 到 npm

## Part 2：改造 quick-press

- [x] 2.1 安装 `@chengxinsun26/editor@^0.1.0`
- [x] 2.2 修改 `next.config.ts`（transpilePackages）
- [x] 2.3 移动 `media-picker.tsx` → `src/components/blog/`
- [x] 2.4 更新 `post-editor.tsx` 的 import
- [x] 2.5 更新 `page-editor.tsx` 的 import
- [x] 2.6 更新 `(public)/blog/[slug]/page.tsx` 的 import
- [x] 2.7 更新 `(public)/pages/[slug]/page.tsx` 的 import
- [x] 2.8 添加 CSS import（globals.css）
- [x] 2.9 删除 `src/editor/` 整个目录
- [x] 2.10 删除冗余 lib 文件
- [x] 2.11 清理冗余依赖（-30 个 tiptap 包）
- [x] 2.12 移除 `onUploadImage` prop（editor 原版不支持）
- [x] 2.13 清理 lockfile + 重新 install
- [x] 2.14 验证 build 通过
- [x] 2.15 验证所有 13 个路由正常

## 完成记录

| 时间 | 任务 | 状态 |
|------|------|------|
| 2026-07-17 | Part 1 全部完成 | ✅ |
| 2026-07-17 | Part 2 全部完成 | ✅ |
