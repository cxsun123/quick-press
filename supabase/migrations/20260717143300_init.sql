-- ============================================
-- quick-press — 数据库初始化
-- ============================================

-- 启用 pg_trgm 全文搜索
create extension if not exists pg_trgm;

-- ============================================
-- Posts
-- ============================================
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users(id) on delete cascade not null,
  title varchar(255) not null,
  slug varchar(255) unique not null,
  content text not null default '',
  excerpt text,
  cover_image_url text,
  status varchar(20) default 'draft' check (status in ('draft', 'published', 'scheduled')),
  is_pinned boolean default false,
  meta jsonb default '{}',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Pages
-- ============================================
create table if not exists pages (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users(id) on delete cascade not null,
  title varchar(255) not null,
  slug varchar(255) unique not null,
  content text not null default '',
  excerpt text,
  parent_id uuid references pages(id) on delete set null,
  template varchar(100) default 'default',
  sort_order int default 0,
  status varchar(20) default 'draft' check (status in ('draft', 'published')),
  meta jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Tags
-- ============================================
create table if not exists tags (
  id uuid default gen_random_uuid() primary key,
  name varchar(100) unique not null,
  slug varchar(100) unique not null,
  description text,
  color varchar(7) default '#3B82F6',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Categories
-- ============================================
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name varchar(100) unique not null,
  slug varchar(100) unique not null,
  description text,
  parent_id uuid references categories(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Post-Tag / Post-Category 关联
-- ============================================
create table if not exists post_tags (
  post_id uuid references posts(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (post_id, tag_id)
);

create table if not exists post_categories (
  post_id uuid references posts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  primary key (post_id, category_id)
);

-- ============================================
-- Comments
-- ============================================
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  page_id uuid references pages(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name varchar(100),
  author_email varchar(255),
  ip varchar(45),
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  status varchar(20) default 'pending' check (status in ('pending', 'approved', 'spam', 'trash')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint comments_post_or_page check (
    (post_id is not null and page_id is null) or
    (post_id is null and page_id is not null)
  )
);

-- ============================================
-- Comment Likes
-- ============================================
create table if not exists comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references comments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  ip varchar(45),
  created_at timestamptz default now(),
  unique(comment_id, user_id),
  unique(comment_id, ip)
);

-- ============================================
-- User Profiles
-- ============================================
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(100),
  avatar_url text,
  bio text,
  website text,
  role varchar(20) default 'subscriber' check (role in ('admin', 'editor', 'author', 'subscriber')),
  social_links jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Site Config（键值对）
-- ============================================
create table if not exists site_config (
  key varchar(100) primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- ============================================
-- User Uploaded Themes
-- ============================================
create table if not exists themes (
  id uuid default gen_random_uuid() primary key,
  name varchar(100) not null,
  storage_path text not null,
  url text not null,
  is_active boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- Media
-- ============================================
create table if not exists media (
  id uuid default gen_random_uuid() primary key,
  uploader_id uuid references auth.users(id) on delete set null,
  filename varchar(255) not null,
  storage_path text not null,
  content_type varchar(100),
  size int,
  width int,
  height int,
  alt text,
  created_at timestamptz default now()
);

-- ============================================
-- 索引
-- ============================================
create index if not exists idx_posts_author on posts(author_id);
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_published_at on posts(published_at desc);
create index if not exists idx_posts_slug on posts(slug);
create index if not exists idx_pages_parent on pages(parent_id);
create index if not exists idx_pages_slug on pages(slug);
create index if not exists idx_comments_post on comments(post_id);
create index if not exists idx_comments_page on comments(page_id);
create index if not exists idx_comments_parent on comments(parent_id);
create index if not exists idx_comments_status on comments(status);
create index if not exists idx_tags_slug on tags(slug);
create index if not exists idx_categories_parent on categories(parent_id);
create index if not exists idx_categories_slug on categories(slug);
create index if not exists idx_media_uploader on media(uploader_id);

-- 全文搜索
create index if not exists idx_posts_title_search on posts using gin (title gin_trgm_ops);
create index if not exists idx_posts_content_search on posts using gin (content gin_trgm_ops);

-- ============================================
-- RLS
-- ============================================
alter table posts enable row level security;
alter table pages enable row level security;
alter table tags enable row level security;
alter table categories enable row level security;
alter table post_tags enable row level security;
alter table post_categories enable row level security;
alter table comments enable row level security;
alter table comment_likes enable row level security;
alter table user_profiles enable row level security;
alter table site_config enable row level security;
alter table media enable row level security;

-- Posts
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Posts public read' and tablename = 'posts'
  ) then
    create policy "Posts public read" on posts for select using (status = 'published');
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Posts admin all' and tablename = 'posts'
  ) then
    create policy "Posts admin all" on posts for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Pages
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Pages public read' and tablename = 'pages'
  ) then
    create policy "Pages public read" on pages for select using (status = 'published');
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Pages admin all' and tablename = 'pages'
  ) then
    create policy "Pages admin all" on pages for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Tags
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Tags public read' and tablename = 'tags'
  ) then
    create policy "Tags public read" on tags for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Tags admin all' and tablename = 'tags'
  ) then
    create policy "Tags admin all" on tags for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Categories
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Categories public read' and tablename = 'categories'
  ) then
    create policy "Categories public read" on categories for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Categories admin all' and tablename = 'categories'
  ) then
    create policy "Categories admin all" on categories for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Post Tags
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Post tags public read' and tablename = 'post_tags'
  ) then
    create policy "Post tags public read" on post_tags for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Post tags admin all' and tablename = 'post_tags'
  ) then
    create policy "Post tags admin all" on post_tags for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Post Categories
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Post categories public read' and tablename = 'post_categories'
  ) then
    create policy "Post categories public read" on post_categories for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Post categories admin all' and tablename = 'post_categories'
  ) then
    create policy "Post categories admin all" on post_categories for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Comments
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Comments public read' and tablename = 'comments'
  ) then
    create policy "Comments public read" on comments for select using (status = 'approved');
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Comments insert' and tablename = 'comments'
  ) then
    create policy "Comments insert" on comments for insert with check (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Comments admin' and tablename = 'comments'
  ) then
    create policy "Comments admin" on comments for update using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- User Profiles
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Profiles public read' and tablename = 'user_profiles'
  ) then
    create policy "Profiles public read" on user_profiles for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Profiles insert own' and tablename = 'user_profiles'
  ) then
    create policy "Profiles insert own" on user_profiles for insert with check (
  auth.uid() = user_id
);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Profiles self' and tablename = 'user_profiles'
  ) then
    create policy "Profiles self" on user_profiles for all using (
  auth.uid() = user_id
);
  end if;
end;
$$;

-- Site Config
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Site config public read' and tablename = 'site_config'
  ) then
    create policy "Site config public read" on site_config for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Site config admin' and tablename = 'site_config'
  ) then
    create policy "Site config admin" on site_config for all using (
  auth.role() = 'authenticated'
);
  end if;
end;
$$;

-- Media
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Media public read' and tablename = 'media'
  ) then
    create policy "Media public read" on media for select using (true);
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Media auth insert' and tablename = 'media'
  ) then
    create policy "Media auth insert" on media for insert with check (auth.role() = 'authenticated');
  end if;
end;
$$;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'Media self' and tablename = 'media'
  ) then
    create policy "Media self" on media for delete using (
  auth.uid() = uploader_id
);
  end if;
end;
$$;

-- ============================================
-- 默认数据
-- ============================================
insert into site_config (key, value) values
  ('site_title', 'quick-press'),
  ('site_description', 'A modern blog CMS'),
  ('registration_mode', 'open')
on conflict (key) do nothing;

-- ============================================
-- 触发器
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_posts_updated_at' and tgrelid = 'posts'::regclass) then
    create trigger trg_posts_updated_at before update on posts
      for each row execute function update_updated_at();
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_pages_updated_at' and tgrelid = 'pages'::regclass) then
    create trigger trg_pages_updated_at before update on pages
      for each row execute function update_updated_at();
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_tags_updated_at' and tgrelid = 'tags'::regclass) then
    create trigger trg_tags_updated_at before update on tags
      for each row execute function update_updated_at();
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_categories_updated_at' and tgrelid = 'categories'::regclass) then
    create trigger trg_categories_updated_at before update on categories
      for each row execute function update_updated_at();
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_comments_updated_at' and tgrelid = 'comments'::regclass) then
    create trigger trg_comments_updated_at before update on comments
      for each row execute function update_updated_at();
  end if;
end;
$$;
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_profiles_updated_at' and tgrelid = 'user_profiles'::regclass) then
    create trigger trg_user_profiles_updated_at before update on user_profiles
      for each row execute function update_updated_at();
  end if;
end;
$$;
