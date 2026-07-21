# 数据库迁移说明

当前项目只有两种状态：

1. **新数据库** — 使用 `supabase/init.sql` 一键初始化完整 schema
2. **已完全同步的现有数据库** — schema 已是最新，无需执行任何操作

> 所有单独迁移文件已被合并到 `supabase/init.sql`。

## 后续数据库变更

如果新增表、列或 Storage bucket，请在此目录下创建新的迁移文件（如 `20260722000001_add_xxx.sql`），然后：

```bash
supabase db push    # 应用到远程
supabase db reset   # 应用到本地
```

迁移文件的命名规则：`<YYYYMMDDHHMMSS>_<描述>.sql`，Supabase 按时间戳顺序执行。
