-- ============================================
-- v0.3: 新增文章可见度、AI 摘要、分享链接字段
-- ============================================

-- Posts 表新字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
  CHECK (visibility IN ('public', 'private', 'password'));

ALTER TABLE posts ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS keywords TEXT[];

ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_token VARCHAR(64);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_share_token ON posts(share_token) WHERE share_token IS NOT NULL;

-- ============================================
-- 更新 RLS 策略：公开列表仅返回 published + public 文章
-- ============================================
DROP POLICY IF EXISTS "Posts public read" ON posts;

CREATE POLICY "Posts public read" ON posts FOR SELECT USING (
  status = 'published'
  AND (visibility = 'public' OR visibility IS NULL OR visibility = '')
);

-- ============================================
-- 创建 Storage bucket（仅首次执行时有效）
-- ============================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

-- Storage RLS 策略
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'media_upload' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "media_upload" on storage.objects
      for insert to authenticated with check (bucket_id = 'media');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'media_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "media_read" on storage.objects
      for select to public using (bucket_id = 'media');
  end if;
end;
$$;

-- ============================================
-- 默认站点配置
-- ============================================
insert into site_config (key, value) values
  ('ai_max_content_length', '100000')
on conflict (key) do nothing;
