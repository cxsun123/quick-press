-- ============================================
-- 修复：缺少表级 GRANT，导致 anon / authenticated / service_role
-- 均无 INSERT/SELECT/UPDATE/DELETE 权限
-- ============================================

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- ============================================
-- RLS 策略修复：添加显式的 WITH CHECK 子句
-- ============================================

-- Tags
drop policy if exists "Tags admin all" on tags;
create policy "Tags admin all" on tags for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Categories
drop policy if exists "Categories admin all" on categories;
create policy "Categories admin all" on categories for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Posts
drop policy if exists "Posts admin all" on posts;
create policy "Posts admin all" on posts for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Pages
drop policy if exists "Pages admin all" on pages;
create policy "Pages admin all" on pages for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Post Tags
drop policy if exists "Post tags admin all" on post_tags;
create policy "Post tags admin all" on post_tags for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Post Categories
drop policy if exists "Post categories admin all" on post_categories;
create policy "Post categories admin all" on post_categories for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Site Config
drop policy if exists "Site config admin" on site_config;
create policy "Site config admin" on site_config for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Themes（添加 RLS 和公开读策略）
alter table themes enable row level security;
drop policy if exists "Themes public read" on themes;
create policy "Themes public read" on themes for select using (true);
drop policy if exists "Themes admin all" on themes;
create policy "Themes admin all" on themes for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);
