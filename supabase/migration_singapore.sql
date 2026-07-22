-- ============================================
-- quick-press — 数据库初始化
-- 包含完整 schema、RLS 策略、Storage bucket
-- 用于新数据库一键初始化
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
  visibility varchar(20) default 'public' check (visibility in ('public', 'private', 'password')),
  password_hash varchar(255),
  password_plaintext varchar(255),
  summary text,
  keywords text[],
  share_token varchar(64),
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

-- 可见度与分享
create index if not exists idx_posts_visibility on posts(visibility);
create unique index if not exists idx_posts_share_token on posts(share_token) where share_token is not null;

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

-- 表级权限（修复：缺少 GRANT 导致 anon/authenticated 无权限）
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Posts
drop policy if exists "Posts public read" on posts;
create policy "Posts public read" on posts for select using (
  status = 'published'
  and (visibility = 'public' or visibility is null or visibility = '')
);
drop policy if exists "Posts admin all" on posts;
create policy "Posts admin all" on posts for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Pages
drop policy if exists "Pages public read" on pages;
create policy "Pages public read" on pages for select using (status = 'published');
drop policy if exists "Pages admin all" on pages;
create policy "Pages admin all" on pages for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Tags
drop policy if exists "Tags public read" on tags;
create policy "Tags public read" on tags for select using (true);
drop policy if exists "Tags admin all" on tags;
create policy "Tags admin all" on tags for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Categories
drop policy if exists "Categories public read" on categories;
create policy "Categories public read" on categories for select using (true);
drop policy if exists "Categories admin all" on categories;
create policy "Categories admin all" on categories for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Post Tags
drop policy if exists "Post tags public read" on post_tags;
create policy "Post tags public read" on post_tags for select using (true);
drop policy if exists "Post tags admin all" on post_tags;
create policy "Post tags admin all" on post_tags for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Post Categories
drop policy if exists "Post categories public read" on post_categories;
create policy "Post categories public read" on post_categories for select using (true);
drop policy if exists "Post categories admin all" on post_categories;
create policy "Post categories admin all" on post_categories for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Comments
drop policy if exists "Comments public read" on comments;
create policy "Comments public read" on comments for select using (status = 'approved');
drop policy if exists "Comments insert" on comments;
create policy "Comments insert" on comments for insert with check (true);
drop policy if exists "Comments admin" on comments;
create policy "Comments admin" on comments for update using (
  auth.role() = 'authenticated'
);

-- User Profiles
drop policy if exists "Profiles public read" on user_profiles;
create policy "Profiles public read" on user_profiles for select using (true);
drop policy if exists "Profiles insert own" on user_profiles;
create policy "Profiles insert own" on user_profiles for insert with check (
  auth.uid() = user_id
);
drop policy if exists "Profiles self" on user_profiles;
create policy "Profiles self" on user_profiles for all using (
  auth.uid() = user_id
);

-- Site Config
drop policy if exists "Site config public read" on site_config;
create policy "Site config public read" on site_config for select using (true);
drop policy if exists "Site config admin" on site_config;
create policy "Site config admin" on site_config for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- Media
drop policy if exists "Media public read" on media;
create policy "Media public read" on media for select using (true);
drop policy if exists "Media auth insert" on media;
create policy "Media auth insert" on media for insert with check (auth.role() = 'authenticated');
drop policy if exists "Media self" on media;
create policy "Media self" on media for delete using (
  auth.uid() = uploader_id
);

-- Themes（RLS + 公开读）
alter table themes enable row level security;
drop policy if exists "Themes public read" on themes;
create policy "Themes public read" on themes for select using (true);
drop policy if exists "Themes admin all" on themes;
create policy "Themes admin all" on themes for all using (
  auth.role() = 'authenticated'
) with check (
  auth.role() = 'authenticated'
);

-- ============================================
-- Storage buckets + RLS 策略
-- ============================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

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

insert into storage.buckets (id, name, public)
values ('themes', 'themes', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'themes_upload' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "themes_upload" on storage.objects
      for insert to authenticated with check (bucket_id = 'themes');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'themes_read' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "themes_read" on storage.objects
      for select to public using (bucket_id = 'themes');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'themes_delete' and tablename = 'objects' and schemaname = 'storage'
  ) then
    create policy "themes_delete" on storage.objects
      for delete to authenticated using (bucket_id = 'themes');
  end if;
end;
$$;

-- ============================================
-- 默认数据
-- ============================================
insert into site_config (key, value) values
  ('site_title', 'quick-press'),
  ('site_description', 'A modern blog CMS'),
  ('registration_mode', 'open'),
  ('ai_max_content_length', '100000')
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

create trigger trg_posts_updated_at before update on posts
  for each row execute function update_updated_at();
create trigger trg_pages_updated_at before update on pages
  for each row execute function update_updated_at();
create trigger trg_tags_updated_at before update on tags
  for each row execute function update_updated_at();
create trigger trg_categories_updated_at before update on categories
  for each row execute function update_updated_at();
create trigger trg_comments_updated_at before update on comments
  for each row execute function update_updated_at();
create trigger trg_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at();


-- ============================================
-- Data Migration
-- ============================================

SET session_replication_role = replica;

INSERT INTO "public"."better_auth_user" ("id", "name", "email", "email_verified", "image", "two_factor_enabled", "created_at", "updated_at") VALUES
	('c92de864-645b-4930-a604-c0a88ec0e455', 'chengxin', 'chengxin.sun@gmail.com', true, NULL, false, '2026-07-16 05:02:39.444441+00', '2026-07-16 05:02:39.444441+00');
INSERT INTO "public"."better_auth_account" ("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") VALUES
	('cdbbadd1-0022-4e2b-98f0-471c44d1985f', 'c92de864-645b-4930-a604-c0a88ec0e455', 'credential', 'c92de864-645b-4930-a604-c0a88ec0e455', NULL, NULL, NULL, NULL, NULL, NULL, '$2b$10$9NOMqsF5u/iNQAxoYhtEvOVahegKycjbXNNGwDn2c4vTl.a6ts17K', '2026-07-16 05:02:39.444441+00', '2026-07-16 05:02:39.444441+00');
INSERT INTO "public"."better_auth_session" ("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id") VALUES
	('kn0MfXaabqFfQtEq7ZBPpHKgRnFkB4yU', '2026-07-18 05:42:01.912+00', 'lx8CwSnX7q5np2rjOivy1rxOdqnczqfp', '2026-07-16 05:07:53.609+00', '2026-07-16 05:42:01.912+00', '0000:0000:0000:0000:0000:0000:0000:0000', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'c92de864-645b-4930-a604-c0a88ec0e455'),
INSERT INTO "public"."pages" ("id", "author_id", "title", "slug", "content", "excerpt", "parent_id", "template", "sort_order", "status", "meta", "created_at", "updated_at") VALUES
	('8030046a-673c-40da-9e9f-6d6abda292f3', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', '我的简介', '我的简介', '**资深全栈软件工程师 | 技术革新探索者**

拥有超过20年的软件与IT行业从业经验，深谙从底层架构到云端部署的完整开发生命周期。在长期的一线研发中，不仅锤炼了扎实的工程化能力，更培养了对业务场景与技术落地的敏锐洞察。

技术于我而言不仅是工具，更是解决问题的艺术。

我始终保持对代码的敬畏与热情，致力于通过优雅的架构设计提升系统的可维护性与扩展性。

近年来，我将核心精力聚焦于**人工智能与机器学习的前沿应用**，深入研究大语言模型（LLM）、AI Agent及向量数据库等新兴技术，积极探索AI在垂直领域的工程化落地，力求用智能算法重塑传统工作流，驱动产品价值的指数级增长。\
\
\
邮箱 [chengxin.sun@gmail.com](mailto:chengxin.sun@gmail.com)', NULL, NULL, 'default', 0, 'published', '{}', '2026-07-21 09:46:06.437683+00', '2026-07-21 09:52:29.513304+00');
INSERT INTO "public"."posts" ("id", "author_id", "title", "slug", "content", "excerpt", "cover_image_url", "status", "is_pinned", "meta", "published_at", "created_at", "updated_at", "visibility", "password_hash", "summary", "keywords", "share_token", "password_plaintext") VALUES
	('adf423a8-ddf9-426c-8991-19a1c6c0594c', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', 'Markdown语法介绍', 'markdown语法介绍', '# [Editor.md](http://Editor.md)

![](https://pandao.github.io/editor.md/images/logos/editormd-logo-180x180.png)

![](https://img.shields.io/github/stars/pandao/editor.md.svg) ![](https://img.shields.io/github/forks/pandao/editor.md.svg) ![](https://img.shields.io/github/tag/pandao/editor.md.svg) ![](https://img.shields.io/github/release/pandao/editor.md.svg) ![](https://img.shields.io/github/issues/pandao/editor.md.svg) ![](https://img.shields.io/bower/v/editor.md.svg)

**目录 (Table of Contents)**

\[TOCM\]

\[TOC\]

Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

# Heading 1 link [Heading link](https://github.com/pandao/editor.md "Heading link")

## Heading 2 link [Heading link](https://github.com/pandao/editor.md "Heading link")

### Heading 3 link [Heading link](https://github.com/pandao/editor.md "Heading link")

#### Heading 4 link [Heading link](https://github.com/pandao/editor.md "Heading link") Heading link [Heading link](https://github.com/pandao/editor.md "Heading link")

##### Heading 5 link [Heading link](https://github.com/pandao/editor.md "Heading link")

###### Heading 6 link [Heading link](https://github.com/pandao/editor.md "Heading link")

#### 标题（用底线的形式）Heading (underline)

# This is an H1#

## This is an H2

### 字符效果和横线等

---

~~删除线~~ ~~删除线（开启识别HTML标签时）~~\
*斜体字* *斜体字*\
**粗体** **粗体**\
***粗斜体*** ***粗斜体***

上标：X<sub>2</sub>，下标：O<sup>2</sup>

**缩写(同HTML的abbr标签)**

> 即更长的单词或短语的缩写形式，前提是开启识别HTML标签时，已默认开启

The HTML specification is maintained by the W3C.

### 引用 Blockquotes

> 引用文本 Blockquotes

引用的行内混合 Blockquotes

> 引用：如果想要插入空白换行`即<br />标签`，在插入处先键入两个以上的空格然后回车即可，[普通链接](http://localhost/)。

### 锚点与链接 Links

[普通链接](http://localhost/)

[普通链接带标题](http://localhost/ "普通链接带标题")

直接链接：<https://github.com>

[锚点链接](http://www.this-anchor-link.com/)

<mailto:test.test@gmail.com>

GFM a-tail link @pandao 邮箱地址自动链接 [test.test@gmail.com](mailto:test.test@gmail.com) [www@vip.qq.com](mailto:www@vip.qq.com)

> @pandao

### 多语言代码高亮 Codes

#### 行内代码 Inline code

执行命令：`npm install marked`

#### 缩进风格

即缩进四个空格，也做为实现类似 `<pre>` 预格式化文本 ( Preformatted Text ) 的功能。

```
<?php
    echo "Hello world!";
?>
```

预格式化文本：

```
| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
```

#### JS代码

```javascript
function test() {
	console.log("Hello world!");
}
 
(function(){
    var box = function() {
        return box.fn.init();
    };

    box.prototype = box.fn = {
        init : function(){
            console.log(''box.init()'');

			return this;
        },

		add : function(str) {
			alert("add", str);

			return this;
		},

		remove : function(str) {
			alert("remove", str);

			return this;
		}
    };
    
    box.fn.init.prototype = box.fn;
    
    window.box =box;
})();

var testBox = box();
testBox.add("jQuery").remove("jQuery");
```

#### HTML 代码 HTML codes

```html
<!DOCTYPE html>
<html>
    <head>
        <mate charest="utf-8" />
        <meta name="keywords" content="Editor.md, Markdown, Editor" />
        <title>Hello world!</title>
        <style type="text/css">
            body{font-size:14px;color:#444;font-family: "Microsoft Yahei", Tahoma, "Hiragino Sans GB", Arial;background:#fff;}
            ul{list-style: none;}
            img{border:none;vertical-align: middle;}
        </style>
    </head>
    <body>
        <h1 class="text-xxl">Hello world!</h1>
        <p class="text-green">Plain text</p>
    </body>
</html>
```

### 图片 Images

Image:

![](https://pandao.github.io/editor.md/examples/images/4.jpg)

> Follow your heart.

![](https://pandao.github.io/editor.md/examples/images/8.jpg)

> 图为：厦门白城沙滩

图片加链接 (Image + Link)：

[![](https://pandao.github.io/editor.md/examples/images/7.jpg)](https://pandao.github.io/editor.md/images/7.jpg "李健首张专辑《似水流年》封面")

> 图为：李健首张专辑《似水流年》封面

---

### 列表 Lists

#### 无序列表（减号）Unordered Lists (-)

- 列表一
- 列表二
- 列表三

#### 无序列表（星号）Unordered Lists (\*)

- 列表一
- 列表二
- 列表三

#### 无序列表（加号和嵌套）Unordered Lists (+)

- 列表一
- 列表二
  - 列表二-1
  - 列表二-2
  - 列表二-3
- 列表三
  - 列表一
  - 列表二
  - 列表三

#### 有序列表 Ordered Lists (-)

1. 第一行
2. 第二行
3. 第三行

#### GFM task list

- GFM task list 1
- GFM task list 2
- GFM task list 3
  - GFM task list 3-1
  - GFM task list 3-2
  - GFM task list 3-3
- GFM task list 4
  - GFM task list 4-1
  - GFM task list 4-2

---

### 绘制表格 Tables

| 项目 | 价格 | 数量 |
| --- | --- | --- |
| 计算机 | $1600 | 5 |
| 手机 | $12 | 12 |
| 管线 | $1 | 234 |

| First Header | Second Header |
| --- | --- |
| Content Cell | Content Cell |
| Content Cell | Content Cell |

| First Header | Second Header |
| --- | --- |
| Content Cell | Content Cell |
| Content Cell | Content Cell |

| Function name | Description |
| --- | --- |
| `help()` | Display the help window. |
| `destroy()` | **Destroy your computer!** |

| Left-Aligned | Center Aligned | Right Aligned |
| --- | --- | --- |
| col 3 is | some wordy text | $1600 |
| col 2 is | centered | $12 |
| zebra stripes | are neat | $1 |

| Item | Value |
| --- | --- |
| Computer | $1600 |
| Phone | $12 |
| Pipe | $1 |

---

#### 特殊符号 HTML Entities Codes

© & ¨ ™ ¡ £\
& &lt; &gt; ¥ € ® ± ¶ § ¦ ¯ « ·

X² Y³ ¾ ¼ × ÷ »

18ºC " ''

\[========\]

### Emoji表情 😃

> Blockquotes ⭐

#### GFM task lists & Emoji & fontAwesome icon emoji & editormd logo emoji :editormd-logo-5x:

- 😃 @mentions, 😃 #refs, links, **formatting**, and ~~tags~~ supported :editormd-logo:;
- list syntax required (any unordered or ordered list supported) :editormd-logo-3x:;
- \[ \] 😃 this is a complete item 😃;
- \[\]this is an incomplete item [test link](#) :fa-star: @pandao;
- \[ \]this is an incomplete item :fa-star: :fa-gear:;
  - 😃 this is an incomplete item [test link](#) :fa-star: :fa-gear:;
  - 😃 this is :fa-star: :fa-gear: an incomplete item [test link](#);

#### 反斜杠 Escape

\*literal asterisks\*

\[========\]

### 科学公式 TeX(KaTeX)

$$
E=mc^2
$$
行内的公式$E=mc^2$行内的公式，行内的$E=mc^2$公式。

$$
x > y
$$
$$
\sqrt{3x-1}+(1+x)^2
$$
$$
\sin(\alpha)^{\theta}=\sum_{i=0}^{n}(x^i + \cos(f))
$$
多行公式：

$$
\displaystyle
\left( \sum\_{k=1}^n a\_k b\_k \right)^2
\leq
\left( \sum\_{k=1}^n a\_k^2 \right)
\left( \sum\_{k=1}^n b\_k^2 \right)
$$
$$
\displaystyle 
    \frac{1}{
        \Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{
        \frac25 \pi}} = 1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {
        1+\frac{e^{-6\pi}}
        {1+\frac{e^{-8\pi}}
         {1+\cdots} }
        } 
    }
$$
```latex
f(x) = \int_{-\infty}^\infty
    \hat f(\xi)\,e^{2 \pi i \xi x}
    \,d\xi
```

### 分页符 Page break

> Print Test: Ctrl + P

\[========\]

### 绘制流程图 Flowchart

```mermaid
flowchart TD
    st([用户登陆])
    op[登陆操作]
    cond{登陆成功 Yes or No?}
    e([进入后台])
    st --> op --> cond
    cond -->|是| e
    cond -->|否| op
```

\[========\]

### 绘制序列图 Sequence Diagram

```mermaid
sequenceDiagram
    participant China
    participant Andrew
    Andrew->>China: Says Hello
    Note right of China: China thinks\nabout it
    China-->>Andrew: How are you?
    Andrew->>China: I am good thanks!
```

### End', NULL, 'https://pandao.github.io/editor.md/images/logos/editormd-logo-180x180.png', 'published', false, '{}', '2026-07-21 01:40:12.042+00', '2026-07-21 01:40:12.598247+00', '2026-07-21 01:40:12.598247+00', 'public', NULL, 'Editor.md是一款开源的在线Markdown编辑器，支持代码高亮、表格、任务列表、Emoji、流程图、数学公式等多种扩展功能。', '{Editor.md,Markdown编辑器,开源,扩展功能}', NULL, NULL),
	('91d794b2-5488-406b-a72c-0bd80a3e8b18', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', '生活之美', '生活之美', '## 后窗的梧桐

![](https://qadhixjbcttztndyyjdz.supabase.co/storage/v1/object/public/media/4f29a5f1-e25a-412c-ba8c-23697fe394d7/1784625495463-n7ftpprse6m.jpg)

那时我住在老城区一栋六层楼的顶层，没有电梯，但有一扇朝西的后窗。窗外正对着一棵梧桐树，枝丫几乎要探进窗子里来。我不认识这树是谁种的，也无人修剪，它便由着性子长。春来，嫩绿的小巴掌从枝头伸出；夏至，便撑开了一整片浓荫；秋风起了，叶子慢慢转黄，一片，两片，无声地落在下面的屋顶上。我便常在窗前看书，看累了，就抬头望那梧桐，望它如何在晨光中醒来，又如何在暮色里睡去。

这大概就是所谓悠闲的滋味了。不是无事可做，而是事情虽在眼前，却可以不急着去做。像溪水绕过石头，不急不恼，依然淙淙地流着。我看过一本旧书，上面引了白居易的诗：“非求宫律高，不务文字奇。唯歌生民病，愿得天子知。”那是另一番境界了。我辈俗人，所图的不过是一窗梧桐，半日清闲罢了。唐代的李涉被贬官后，在九江遇雨，写在寺庙墙上的那句“因过竹院逢僧话，偷得浮生半日闲”，倒更合我的心意。一个“偷”字用得真好——仿佛那半日闲暇是从忙碌的指缝间悄悄溜出来的，带着一点狡黠的欢喜。

说到闲，想起清人张潮在《幽梦影》里的话：“人莫乐于闲，非无所事事之谓也。闲则能读书，闲则能游名胜，闲则能交益友，闲则能饮酒，闲则能著书。天下之乐，孰大于是？”他说的闲，是心里空出一块地方来，好让别的东西进去。我读这段文字的那天下午，正坐在窗前，手上捧着一杯温热的茶。梧桐叶的影子落在书页上，随着微风轻轻晃动，那影子便像是活的，在字里行间游走。我忽然想，我的生活里，原也有这样的闲——早起给阳台上的茉莉浇水，看露珠在叶尖颤巍巍地挂着；黄昏时在菜市场慢慢走，看鱼在盆里摆尾，看青菜上还带着泥；夜里关了灯，听远处偶尔传来的犬吠，不知谁家的，叫几声便停了。

记得有一年秋天，梧桐叶子落得特别慢。我从窗里望出去，见一片叶子在半空中打着旋，风来了，它便往左飘；风停了，它又往右荡，就是不肯落下来。我竟看了许久，直到那片叶子终于轻轻躺在了对面的瓦上，才恍然惊觉时间已经过去。那一刻，我忽然懂得了什么叫“浮生”——人的一生，不也像那片叶子么？在风里打着转，看似身不由己，却也自有它的从容。现代人总说要把时间填满，像往布袋里塞东西，塞得鼓鼓囊囊才算充实。可布袋太满了，就提不动了。留些空隙，让风能穿过去，让光能透进来，布袋才是个活的东西。

梧桐的叶子又绿了。我望着窗外的树影，觉得生活之美，大约就在这不经意的一瞥之间。像茶要慢慢泡才有味道，日子也要慢慢过才见得着颜色。那颜色不在远处，就在这寻常的午后——一本书，一杯茶，一窗摇动的树影，和一个偶尔走神的人。', NULL, NULL, 'published', false, '{}', '2026-07-21 09:19:28.281+00', '2026-07-21 09:18:28.894053+00', '2026-07-21 09:19:28.815745+00', 'public', NULL, '后窗的梧桐 那时我住在老城区一栋六层楼的顶层，没有电梯，但有一扇朝西的后窗。窗外正对着一棵梧桐树，枝丫几乎要探进窗子里来。我不认识这树是谁种的，也无人修剪，它便由着性子长。春来，嫩绿的小巴掌从枝头伸出...', NULL, NULL, NULL),
	('0fb77cfd-fa5a-4ce4-bc0d-71bfe3c56f4c', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', 'useEffect()简述', 'useeffect-简述', '### 1. React 的两套 API 与组件差异

- **两套 API**：React 目前支持“类（Class）API”和“基于函数的钩子（Hooks）API”。官方更推荐使用轻量、简洁的钩子 API。
- **核心差异**：
- **类组件**：将状态（数据）和操作逻辑封装在一起。
- **函数组件**：本质上应该是“纯函数”，主要职责是根据输入参数返回组件的 HTML 代码，不应直接包含其他复杂操作。

![](https://qadhixjbcttztndyyjdz.supabase.co/storage/v1/object/public/media/4f29a5f1-e25a-412c-ba8c-23697fe394d7/1784624989239-zzqh53cyok8.jpeg)

### 2. 什么是副效应（Side Effect）与钩子（Hook）？

- **副效应**：纯函数只负责数据计算。与数据计算无关的操作（如获取远程数据、改变 DOM、设置定时器等）被称为“副效应”。
- **钩子的作用**：由于函数组件本身是纯函数，**钩子（Hook）就是用来为函数组件引入副效应的解决方案**。`useEffect()` 是最常用的通用副效应钩子。

### 3. `useEffect()` 的核心用法

- **基本运行机制**：`useEffect()` 接受一个函数作为参数。组件每次渲染后，React 都会自动执行这个副效应函数。

- **第二个参数（依赖项数组）**：

- 如果不希望每次渲染都执行，可以传入一个数组来指定依赖项。只有当依赖项发生变化时，副效应函数才会重新执行。

- 如果传入\*\*空数组 `[]**`，表示没有任何依赖，该副效应函数只会在组件首次加载到 DOM 后执行一次。

- **常见用途**：包括获取服务器数据（Data Fetching）、事件监听与订阅、改变 DOM 以及输出日志等。

### 4. 副效应的清理与注意事项

- **清理机制（返回值）**：`useEffect()` 允许返回一个函数。这个返回的函数会在组件卸载时，或者在下一次副效应函数重新执行前调用，用于清理上一次的副效应（例如清除定时器、取消事件订阅）。
- **最佳实践**：如果组件中有多个不相关的副效应（例如两个不同的定时器），\*\*应该调用多个独立的 `useEffect()**`，而不是将它们合并写在一个里面，以便于维护和避免逻辑混乱。

---

你是否需要我针对其中某一个具体用法（例如如何使用 `useEffect` 获取远程数据）提供更详细的代码解析？', NULL, NULL, 'published', false, '{}', '2026-07-21 09:19:57.624+00', '2026-07-21 09:10:21.905371+00', '2026-07-21 09:19:57.748495+00', 'public', NULL, '1. React 的两套 API 与组件差异 - 两套 API ：React 目前支持“类（Class）API”和“基于函数的钩子（Hooks）API”。官方更推荐使用轻量、简洁的钩子 API。 - ...', NULL, NULL, NULL);
INSERT INTO "public"."media" ("id", "uploader_id", "filename", "storage_path", "content_type", "size", "width", "height", "alt", "created_at") VALUES
	('4bfc94f8-7e8f-40c2-9de2-d5358ce3545e', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', 'images.jpeg', '4f29a5f1-e25a-412c-ba8c-23697fe394d7/1784625036860-qd7xsqamugj.jpeg', 'image/jpeg', 60047, NULL, NULL, NULL, '2026-07-21 09:10:37.748876+00'),
	('4e49a22b-3a4c-4b57-979d-ba208d6ce60a', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', 'images.jpeg', '4f29a5f1-e25a-412c-ba8c-23697fe394d7/1784625193965-ujqlfifk5oo.jpeg', 'image/jpeg', 60047, NULL, NULL, NULL, '2026-07-21 09:13:17.854735+00'),
	('9ea99a34-e457-4c08-b9b5-71146cd6fb56', '4f29a5f1-e25a-412c-ba8c-23697fe394d7', 'boat.jpg', '4f29a5f1-e25a-412c-ba8c-23697fe394d7/1784625495463-n7ftpprse6m.jpg', 'image/jpeg', 47487, NULL, NULL, NULL, '2026-07-21 09:18:16.645075+00');
INSERT INTO "public"."petrichor_user" ("id", "auth_user_id", "email", "password_hash", "system_role", "user_type", "linuxdo_account_id", "linuxdo_username", "linuxdo_email", "username", "nickname", "avatar", "signature", "created_at", "updated_at") OVERRIDING SYSTEM VALUE VALUES
	(1, 'c92de864-645b-4930-a604-c0a88ec0e455', 'chengxin.sun@gmail.com', '$2b$10$9NOMqsF5u/iNQAxoYhtEvOVahegKycjbXNNGwDn2c4vTl.a6ts17K', 'SUPER_ADMIN', 'LOCAL', NULL, NULL, NULL, 'chengxin.sun', 'chengxin', NULL, NULL, '2026-07-16 05:02:39.444441+00', '2026-07-16 05:02:39.444441+00');
INSERT INTO "public"."petrichor_kb_knowledge_base" ("id", "user_id", "name", "description", "created_at", "updated_at") OVERRIDING SYSTEM VALUE VALUES
	(1, 1, 'AI', NULL, '2026-07-16 05:03:10.161978+00', '2026-07-16 05:03:10.161978+00');
INSERT INTO "public"."petrichor_kb_node" ("id", "user_id", "knowledge_base_id", "parent_id", "type", "name", "sort_order", "created_at", "updated_at") OVERRIDING SYSTEM VALUE VALUES
	(1, 1, 1, NULL, 'ARTICLE', 'Petrichor', 1, '2026-07-16 05:04:05.662975+00', '2026-07-16 05:04:05.662975+00'),
	(2, 1, 1, NULL, 'ARTICLE', 'AGENTS.md - 项目指南', 2, '2026-07-16 05:41:17.363379+00', '2026-07-16 05:48:18.404+00');
INSERT INTO "public"."petrichor_kb_article" ("id", "user_id", "knowledge_base_id", "node_id", "title", "content_md", "content_json", "content_meta_json", "public_excerpt", "reading_minutes", "toc_json", "public_content_hash", "ai_summary", "ai_summary_content_hash", "ai_summary_generated_at", "mindmap_json", "mindmap_content_hash", "mindmap_generated_at", "mindmap_kg_json", "mindmap_kg_content_hash", "mindmap_kg_generated_at", "created_at", "updated_at") OVERRIDING SYSTEM VALUE VALUES
	(1, 1, 1, 1, 'Petrichor', '<div align="center">

<img src="apps/web/public/sidebar-logo.jpg" alt="Petrichor" width="120" height="120" />

# Petrichor

**一个开箱即用的全栈知识库与博客平台 · 基于 Next.js + Supabase + Vercel**

*An open-source full-stack knowledge base & blog platform built with Next.js, Supabase and Vercel.*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](#-vercel-一键部署傻瓜式教程)

[**🌐 产品介绍**](https://wl.do/tags) ·
[**📖 在线 Demo（前台）**](https://wl.do)

[**🚀 一键部署到 Vercel**](#-vercel-一键部署傻瓜式教程) ·
[功能特性](#-功能特性) ·
[环境变量](#-环境变量速查表) ·
[本地开发](#-本地开发) ·
[English](#english)

</div>

---

<div align="center">

### 💬 微信交流群

<img src="apps/web/public/wechat-group-qr.png" alt="微信交流群二维码" width="220" />

扫码添加作者微信（Cizai_），交流使用与开发问题，并拉你进交流群

</div>

---

## 📖 简介

**Petrichor**是一个个人/小团队场景下的现代化知识库与博客平台，集成了富文本编辑器、知识库管理、文章发布、AI 写作助手、AI 回顾周报/月报、对象存储上传等能力。

整套系统支持 **Vercel + Supabase** 部署，零自建服务器即可上线，仅需配置好环境变量就能拥有一个完整可用的内容平台。

---

## ✨ 功能特性

| 模块 | 能力 |
| --- | --- |
| **📝 富文本编辑器** | 基于 PlateJS，支持 Markdown、代码块、表格、数学公式、白板、思维导图、媒体嵌入等 |
| **📚 知识库** | 多层级目录树、文章标签、文章分享、文章 RSS/Atom Feed |
| **🤖 AI 助手** | AI 续写 / 改写 / 翻译 / 语气调整、AI 文章总结、AI 周报 & 月报回顾 |
| **🔐 认证体系** | Better Auth + httpOnly Cookie，支持邮箱密码、LinuxDo OAuth、二步验证 |
| **🗂️ 对象存储** | S3 兼容上传（封面、附件、头像），支持预签名 URL |
| **📊 仪表盘** | 写作数据统计、活跃度图、知识库分布 |
| **🎨 主题与外观** | 浅色/深色模式、自定义网站标题/图标、Retypeset 主题博客首页 |
| **🌐 公开站点** | 文章公开页、SEO 元数据、RSS、Atom、sitemap.xml |
| **🛠️ Agent 集成** | API Key 管理、MCP Server（Streamable HTTP，兼容 Claude Code / Codex / Cursor）、Skill 包（兼容 Claude Code / Codex）、调用审计日志、REST 能力层 |

---

## 🚀 Vercel 一键部署（傻瓜式教程）

> 整个过程大约 **5–10 分钟**，无需懂代码，只要会复制粘贴。

### 第 1 步：准备一个 Supabase 数据库（免费）

1. 打开 <https://supabase.com>，注册并登录。
2. 点击 **New Project**，填写项目名（如 `petrichor`），设置一个数据库密码，**密码记下来**。
3. 等待数据库初始化完成（约 1–2 分钟）。
4. 进入 **Project Settings → Database → Connection string**，选择 **Transaction (port 6543)** 模式，复制连接串。它形如：
   ```
   postgresql://postgres.xxxxxxx:你的密码@aws-1-us-west-2.pooler.supabase.com:6543/postgres
   ```
   这串就是后面要填的 **`DATABASE_URL`**。

### 第 2 步：准备一个 S3 兼容的对象存储

任选其一即可，都有免费额度：

| 服务 | 推荐场景 | 链接 |
| --- | --- | --- |
| **缤纷云 Bitiful** | 国内访问快、免费额度大 | <https://www.bitiful.com> |
| **AWS S3** | 标准方案 | <https://aws.amazon.com/s3/> |
| **MinIO** | 自托管 | <https://min.io> |

创建一个 Bucket（公开读权限），并获取以下信息：

- **S3_ENDPOINT**：S3 API 地址，例如 `https://blog-1.s3.bitiful.net`
- **S3_REGION**：区域，例如 `cn-east-1`、`us-east-1`、`auto`
- **S3_BUCKET**：桶名
- **S3_ACCESS_KEY_ID** / **S3_SECRET_ACCESS_KEY**：访问密钥对

### 第 3 步：生成必要的密钥

随机生成 3 串密钥，本地终端执行（macOS / Linux 通用）：

```bash
# SESSION_SECRET：32 字节 base64
openssl rand -base64 32

# PETRICHOR_ENCRYPT_KEY：32 字节 base64
openssl rand -base64 32

# PETRICHOR_ENCRYPT_SALT：8 字节 hex（16 位十六进制）
openssl rand -hex 8
```

> Windows 用户：可在 <https://www.random.org/bytes/> 上分别生成对应长度的随机串，或用 PowerShell 的 `[Convert]::ToBase64String((1..32 | %{[byte](Get-Random -Min 0 -Max 256)}))`。

把这 3 串结果先保存到记事本，待会儿填到部署平台。

### 第 4 步：点击下方按钮，一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCiao1019%2FPetrichor&project-name=petrichor&repository-name=petrichor&root-directory=apps%2Fweb&env=DATABASE_URL,SESSION_SECRET,PETRICHOR_ENCRYPT_KEY,PETRICHOR_ENCRYPT_SALT,S3_ENDPOINT,S3_REGION,S3_BUCKET,S3_ACCESS_KEY_ID,S3_SECRET_ACCESS_KEY,NEXT_PUBLIC_APP_URL&envDescription=%E5%A1%AB%E5%85%A5%E6%95%B0%E6%8D%AE%E5%BA%93%E3%80%81%E4%BC%9A%E8%AF%9D%E5%AF%86%E9%92%A5%E3%80%81%E5%8A%A0%E5%AF%86%E5%AF%86%E9%92%A5%E5%92%8C%E5%AF%B9%E8%B1%A1%E5%AD%98%E5%82%A8%E7%AD%89%E5%BF%85%E5%A1%AB%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F&envLink=https%3A%2F%2Fgithub.com%2FCiao1019%2FPetrichor%23-%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E9%80%9F%E6%9F%A5%E8%A1%A8)

按钮会自动：

- ✅ 把当前仓库 Fork 到你自己的 GitHub
- ✅ 在 Vercel 创建一个新项目
- ✅ 把 **Root Directory** 自动设为 `apps/web`
- ✅ 弹出表单让你填入所有**必填**环境变量

按照下表把第 1–3 步收集到的值粘贴进去：

| 字段 | 填什么 |
| --- | --- |
| `DATABASE_URL` | 第 1 步 Supabase 的 Transaction Pooler 连接串 |
| `SESSION_SECRET` | 第 3 步生成的 base64（必须 ≥ 32 字符） |
| `PETRICHOR_ENCRYPT_KEY` | 第 3 步生成的 base64 |
| `PETRICHOR_ENCRYPT_SALT` | 第 3 步生成的 16 位 hex |
| `S3_ENDPOINT` | 第 2 步的 S3 接入点 |
| `S3_REGION` | 第 2 步的区域名 |
| `S3_BUCKET` | 第 2 步的桶名 |
| `S3_ACCESS_KEY_ID` | 第 2 步的 Access Key ID |
| `S3_SECRET_ACCESS_KEY` | 第 2 步的 Secret Access Key |
| `NEXT_PUBLIC_APP_URL` | **先随便填 `http://localhost:3000`，部署完成后再来改成你的真实域名（如 `https://你的项目.vercel.app`）** |

填完点 **Deploy**，等待 2–4 分钟构建完成。

### 第 5 步：初始化数据库表结构（只做一次）

部署完成后，先把数据库表建好，否则页面会报错。

1. 在本地终端把项目克隆下来（用第 4 步 fork 出去的仓库）：
   ```bash
   git clone https://github.com/你的用户名/petrichor.git
   cd petrichor
   pnpm install
   ```
2. 生成初始化 SQL：
   ```bash
   pnpm --silent --filter @petrichor/web db:sql > petrichor-init.sql
   ```
3. 打开 Supabase → **SQL Editor** → **New query**，把 `petrichor-init.sql` 全部内容粘贴进去，点 **Run** 执行。
4. 看到 “Success. No rows returned” 即代表表结构已就绪。

> 不想本地装环境？直接打开仓库里的 [`docs/petrichor-init.sql`](docs/petrichor-init.sql) 复制粘贴也行。该文件随仓库提供，与最新表结构同步。

### 第 6 步：创建第一个超级管理员账号

> ⚠️ **初始化 SQL 不会自动创建任何用户**。数据库刚跑完上一步时是空的，需要自己造一个超级管理员。
>
> 二选一，**推荐方法 A**（不用写 SQL、不用懂 bcrypt）。

#### 方法 A：临时开放注册 → 注册 → 关闭注册（推荐）

> 🎯 **首位管理员会自动产生**：当数据库里还没有任何 `SUPER_ADMIN` 时，**第一个注册成功的账号会自动成为超级管理员**，无需再手动配置 `PETRICHOR_REGISTER_DEFAULT_SYSTEM_ROLE`。之后再注册的账号才按默认角色（`USER`）创建。

1. 在 Vercel → **Settings → Environment Variables** 新增一个变量（**所有环境**勾选 Production / Preview / Development）：

   | 变量 | 临时填 |
   | --- | --- |
   | `NEXT_PUBLIC_REGISTER_ENABLED` | `true` |

2. 进入 **Deployments → ⋯ → Redeploy** 让新环境变量生效（约 2 分钟）。
3. 打开你的 Vercel 域名 `https://你的项目.vercel.app/login`，**点「注册」**，填邮箱和密码，提交。系统里此时还没有管理员，这个账号会自动成为超级管理员。
4. 注册成功后立即返回 Vercel → Environment Variables，把变量改回安全值：

   | 变量 | 改回 |
   | --- | --- |
   | `NEXT_PUBLIC_REGISTER_ENABLED` | `false` |

5. 再点一次 **Redeploy**，登录页的「注册」入口就消失了，从此只有管理员能从后台手动加用户。

#### 方法 B：直接在 Supabase SQL Editor 插入（需要本地 Node）

1. 在本地仓库目录生成 bcrypt 密码哈希（先 `pnpm install` 安装依赖）：
   ```bash
   cd apps/web
   node -e "console.log(require(''bcryptjs'').hashSync(''替换成你的明文密码'', 10))"
   ```
   会输出形如 `$2a$10$...` 的哈希串，复制下来。

2. 打开 Supabase → SQL Editor，粘贴下面 SQL，把 3 个占位符替换后 **Run**：

   ```sql
   do $$
   declare
       v_email         text := ''admin@example.com'';                    -- 改成你的邮箱
       v_password_hash text := ''$2a$10$把上一步的哈希粘贴到这里'';        -- 改成上面生成的哈希
       v_nickname      text := ''Admin'';                                -- 显示名
       v_auth_user_id  text := gen_random_uuid()::text;
       v_username      text := split_part(v_email, ''@'', 1);
   begin
       insert into better_auth_user (id, name, email, email_verified, created_at, updated_at)
       values (v_auth_user_id, v_nickname, lower(v_email), true, now(), now())
       on conflict (email) do nothing;

       insert into petrichor_user (auth_user_id, email, password_hash, system_role, user_type, username, nickname)
       values (v_auth_user_id, lower(v_email), v_password_hash, ''SUPER_ADMIN'', ''LOCAL'', v_username, v_nickname)
       on conflict (email) do nothing;

       insert into better_auth_account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       values (gen_random_uuid()::text, v_auth_user_id, ''credential'', v_auth_user_id, v_password_hash, now(), now())
       on conflict (provider_id, account_id) do nothing;
   end $$;
   ```

3. 用这个邮箱密码登录即可。

### 第 7 步：回填 `NEXT_PUBLIC_APP_URL` 并重新部署

1. 在 Vercel 项目首页找到自己分配到的域名，例如 `https://petrichor-abc123.vercel.app`。
2. 进入 **Settings → Environment Variables**，把 `NEXT_PUBLIC_APP_URL` 改成上面这个域名（**不要带斜杠结尾**）。
3. 进入 **Deployments**，对最新一次部署点 **⋯ → Redeploy**。

**完成！** 🎉 用第 6 步创建的管理员账号登录，开始使用。

---

## 🔐 环境变量速查表

### ✅ 必填（缺一不可，否则启动失败）

| 变量 | 类型 / 校验 | 用于什么功能 |
| --- | --- | --- |
| `DATABASE_URL` | Postgres 连接串，非空 | **所有数据持久化**：用户、文章、知识库、通知、AI 配置、上传记录等。生产环境务必使用 Supabase **Transaction Pooler** 连接串（端口 6543） |
| `SESSION_SECRET` | base64 字符串，**至少 32 字符** | **登录会话 Cookie 签名**（Better Auth）。一旦上线**不要修改**，否则所有已登录用户会被踢下线 |
| `PETRICHOR_ENCRYPT_KEY` | base64 字符串，建议 32 字节 | **AI 模型 API Key 加密存储**。用户在后台配置的 OpenAI / Gemini / DeepSeek API Key 都会用它加密后写入数据库 |
| `PETRICHOR_ENCRYPT_SALT` | 16 位十六进制字符串 | 与 `PETRICHOR_ENCRYPT_KEY` 配套使用的盐值。**一旦有真实数据后不能再换**，否则历史密文无法解密 |

### 📦 对象存储（上传相关功能依赖；不配则上传按钮会报错）

支持两种存储提供商（通过 `STORAGE_PROVIDER` 切换，默认 `s3`）：

#### S3 兼容存储（默认）

| 变量 | 用于什么功能 |
| --- | --- |
| `S3_ENDPOINT` | S3 接入点（含或不含 `https://` 均可，未带协议时会自动按 `S3_USE_SSL` 补全） |
| `S3_REGION` | 区域，默认 `us-east-1` |
| `S3_BUCKET` | 存储桶名 |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | S3 凭据，用于服务端签名预签名 URL |
| `S3_UPLOAD_EXPIRE_SECONDS` | 上传用预签名 URL 有效期（秒），默认 `900` |
| `S3_DOWNLOAD_EXPIRE_SECONDS` | 下载用预签名 URL 有效期（秒），默认 `3600` |
| `S3_USE_SSL` | `S3_ENDPOINT` 未带协议时是否补 `https://`，默认 `true` |

#### Supabase Storage（可选）

| 变量 | 用于什么功能 |
| --- | --- |
| `STORAGE_PROVIDER` | 设为 `supabase` 启用，默认 `s3` |
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key（用于服务端签名预签名 URL） |
| `SUPABASE_STORAGE_BUCKET` | 存储桶名，默认 `media` |
| `SUPABASE_STORAGE_URL_TTL` | 预签名 URL 有效期（秒），默认 `3600` |

**用到存储的功能：** 文章封面上传、附件上传、用户头像上传、知识库文件附件、AI 文章总结配图等。

### 🌐 应用与公开页

| 变量 | 用于什么功能 |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | **公开站点完整 URL**（如 `https://yourdomain.com`、`https://你的项目.vercel.app`）。用于：文章分享链接、RSS/Atom 链接生成、OAuth 回调地址 fallback、SEO `og:url`。部署完成后**务必回填**为真实域名 |
| `NEXT_PUBLIC_REGISTER_ENABLED` | 是否在登录页显示「注册」入口，`"true"` / `"false"`，默认 `"false"`（关闭注册，仅管理员手动添加用户） |
| `PETRICHOR_REGISTER_DEFAULT_SYSTEM_ROLE` | 开放注册时新用户默认角色，只允许 `USER` 或 `SUPER_ADMIN`，默认 `USER`。**通常无需设置**：系统里还没有任何超级管理员时，第一个注册的账号会自动成为 `SUPER_ADMIN` |
| `PETRICHOR_SESSION_EXPIRE_SECONDS` | 登录态有效期（秒），默认 `172800`（2 天） |

### 🔗 LinuxDo OAuth（可选第三方登录）

不需要 LinuxDo 登录可以**全部留空**。

| 变量 | 用于什么功能 |
| --- | --- |
| `PETRICHOR_LINUXDO_CLIENT_ID` | LinuxDo OAuth 应用 Client ID |
| `PETRICHOR_LINUXDO_CLIENT_SECRET` | LinuxDo OAuth 应用 Client Secret |
| `PETRICHOR_LINUXDO_REDIRECT_URI` | OAuth 回调地址，需与 LinuxDo 应用注册一致；留空则取 `NEXT_PUBLIC_APP_URL + /api/auth/callback` |

> 在 <https://connect.linux.do> 注册一个 OAuth 应用即可获得 ID 和 Secret，回调地址填 `https://你的域名/api/auth/callback`。

---

## 🛠️ Agent 集成（Skill 包 / REST 能力层）

Petrichor 内置了一套**面向外部 Agent**（Claude Code、Codex、Cursor、ChatGPT 桌面端等）的开放能力，让 AI 工具能直接读写你的知识库。

### 能力一览

| 子模块 | 入口 | 说明 |
| --- | --- | --- |
| **API Key 管理** | 仪表盘 → Agent 集成 → API Key 管理 | 生成 / 撤销外部 Agent 调用密钥。明文仅展示一次，服务端只存 `sha256` 哈希 |
| **Skill 包** | 仪表盘 → Agent 集成 → Skill 包 | 下载 `petrichor-agent-skills.zip`，内含一个顶层 `petrichor` Skill 与 `config.json`；兼容旧单文件 `SKILL.md` |
| **调用日志** | 仪表盘 → Agent 集成 → 调用日志 | 完整审计：来源 Agent、工具、IP、UA、入参、出参、状态码、耗时 |
| **REST 能力层** | `/api/agent/**` | 所有外部接口统一鉴权 + 审计，可直接被任意 HTTP 客户端调用 |

### Skill 包结构

下载后的压缩包是一个顶层 `petrichor/` Skill，外部 Agent 工具的侧栏只会出现一个 `petrichor`。根目录 `SKILL.md` 内置路由表，按用户意图按需读取下列子文档（不会一次性加载）：

| 子文档 | 触发时机 |
| --- | --- |
| `config.json` | Skill 包内配置文件，填写站点地址与 Agent API Key |
| `skills/setup.md` | 首次配置、自检、API Key 权限检查、接口发现 |
| `skills/articles.md` | 新建 / 更新 / 删除文章、创建文件夹、移动文章 |
| `skills/docs.md` | 浏览知识库、查看目录树、列文章、搜索文档、查看正文 / Wiki |
| `skills/qa.md` | 基于知识库上下文的文档问答（含跨库问答） |
| `skills/share.md` | 公开 / 撤销文章分享、设置访问密码与到期时间 |
| `skills/ai.md` | AI 摘要、思维导图、知识图谱生成 |

`scripts/petrichor`（零依赖 Python CLI）、`scripts/petrichor-api.sh`（curl 兜底）和 `references/endpoints.md`（完整接口字段说明）整个 skill 共用一份，默认读取同目录的 `config.json`。

### 接入步骤

1. **生成 API Key**：仪表盘 → **Agent 集成 → API Key 管理 → 新建**，按需勾选权限（`article:write` / `article:delete` / `doc:read` / `qa:read`），保存明文。
2. **下载 Skill 包**：仪表盘 → **Agent 集成 → Skill 包 → 下载包**，或直接访问 `/api/agent/skill-pack`，得到 `petrichor-agent-skills.zip`。
3. **导入 Agent 工具**：解压后将 Skill 目录放入 Claude Code / Codex 对应的 Skills 路径（参考各工具文档）。
4. **编辑配置文件**：打开解压后的 `petrichor/config.json`，确认 `baseUrl`，并把 `apiKey` 改成上一步生成的明文 Key。
5. **调用约定**：Skill 包内 CLI 会从 `config.json` 读取 `apiKey`，并自动携带 `Authorization: Bearer <apiKey>`。
6. **审计**：每次调用都会自动写入「调用日志」，登录用户可在仪表盘内回看。

> 公开接口清单：未带鉴权也能访问的 `GET /api/agent/manifest` 会列出全部可用接口、参数和所需权限，方便 Agent 自动发现能力。详细设计见 [`docs/agent-integration.md`](docs/agent-integration.md)。

### 🧪 完整模板

参考 [`apps/web/.env.example`](apps/web/.env.example) 或直接复制：

```ini
# 必填
DATABASE_URL="postgres://postgres:[password]@[host]:6543/postgres"
SESSION_SECRET="<openssl rand -base64 32 的输出>"
PETRICHOR_ENCRYPT_KEY="<openssl rand -base64 32 的输出>"
PETRICHOR_ENCRYPT_SALT="<openssl rand -hex 8 的输出>"

# S3 兼容对象存储
S3_ENDPOINT="https://s3.example.com"
S3_REGION="us-east-1"
S3_BUCKET="your-bucket"
S3_ACCESS_KEY_ID="your-access-key-id"
S3_SECRET_ACCESS_KEY="your-secret-access-key"
S3_UPLOAD_EXPIRE_SECONDS="900"
S3_DOWNLOAD_EXPIRE_SECONDS="3600"
S3_USE_SSL="true"

# 应用 URL 与注册策略
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_REGISTER_ENABLED="false"
PETRICHOR_REGISTER_DEFAULT_SYSTEM_ROLE="USER"
PETRICHOR_SESSION_EXPIRE_SECONDS="172800"

# 可选：LinuxDo OAuth
PETRICHOR_LINUXDO_CLIENT_ID=""
PETRICHOR_LINUXDO_CLIENT_SECRET=""
PETRICHOR_LINUXDO_REDIRECT_URI=""
```

---

## 💻 本地开发

### 前置依赖

- Node.js **≥ 22**
- pnpm **10.x**（推荐 `corepack enable && corepack prepare pnpm@10.28.1 --activate`）
- 一个可用的 Postgres 数据库（Supabase / 本地 Docker / 远程均可）

### 启动

```bash
git clone https://github.com/Ciao1019/Petrichor.git petrichor
cd petrichor
pnpm install
cp apps/web/.env.example apps/web/.env.local
# 编辑 apps/web/.env.local 填入真实值

# 初始化数据库（生成 SQL 后到 Supabase / psql 执行）
pnpm --silent --filter @petrichor/web db:sql > petrichor-init.sql

pnpm dev
```

打开 <http://localhost:3000>。

### 常用命令

```bash
pnpm dev           # 启动开发服务器
pnpm build         # 生产构建
pnpm test          # 单元测试（Vitest）
pnpm typecheck     # TypeScript 类型检查
pnpm lint          # ESLint
```

---

## 📁 项目结构

```
.
├── apps/
│   └── web/                     # Next.js 全栈应用
│       ├── app/                 # App Router 入口、API route、RSS/sitemap
│       │   └── api/agent/       # 外部 Agent REST 能力层（manifest / skill / skill-pack 等）
│       ├── src/
│       │   ├── client-app.tsx   # 客户端 SPA 入口
│       │   ├── features/pages/  # 业务页面（dashboard / blog / kb / ai / agent / admin ...）
│       │   ├── components/      # 通用组件 + shadcn/ui
│       │   ├── lib/             # 前端工具与 API client
│       │   ├── server/          # 服务端 handler / 业务逻辑 / Drizzle schema
│       │   │   └── agent/       # Agent 接入逻辑：API Key、Skill 生成、审计
│       │   └── config/          # 环境变量解析与服务端配置
│       └── .env.example
├── docs/
│   ├── petrichor-init.sql       # 完整初始化 SQL（与代码同步）
│   ├── create-first-admin.sql   # 创建第一个超级管理员账号的 SQL 模板
│   ├── agent-integration.md     # Agent 集成（Skill 包 / REST）设计说明
│   ├── migrations/              # 历史增量迁移脚本
│   └── assets/                  # 文档资源（logo 等）
├── AGENTS.md                    # 给 AI 协作者的项目级说明
├── LICENSE                      # Apache 2.0
└── README.md
```

---

## 🤝 贡献

欢迎 Issue / PR。提交前请确保：

```bash
pnpm typecheck
pnpm lint
pnpm test
```

全部通过。

代码风格、提交约定、UI 复用与目录规范详见 [`AGENTS.md`](AGENTS.md)。

---

## 🙏 致谢

- 本项目的前台公开站点 UI 与排版设计借鉴自 [**astro-theme-retypeset**](https://github.com/radishzzz/astro-theme-retypeset) —— 一个优雅、克制、专注阅读的 Astro 博客主题。感谢作者 [@radishzzz](https://github.com/radishzzz) 在中文排版与视觉细节上的精心打磨，为本项目的公开页提供了重要灵感。
- 感谢 [LinuxDo](https://linux.do/) 社区的支持。
---

## 📄 License

[Apache License 2.0](LICENSE) © 2026 Petrichor Contributors

---

## English

**Petrichor** (repo codename *Dosphere*) is a self-hostable knowledge-base & blog platform powered by **Next.js 16 + Supabase + Vercel**, featuring a PlateJS rich-text editor, multi-level knowledge tree, AI writing assistant (continue / rewrite / translate / tone), AI weekly & monthly reviews, S3-compatible uploads, Better Auth with optional LinuxDo OAuth, and an **Agent integration layer** (REST + downloadable Skill packs compatible with Claude Code / Codex) with full call auditing.

### Links

- 🌐 **Product site**: <https://petrichor.wl.do>
- 📖 **Live demo (public site)**: <https://wl.do>

### Quick deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCiao1019%2FPetrichor&project-name=petrichor&repository-name=petrichor&root-directory=apps%2Fweb&env=DATABASE_URL,SESSION_SECRET,PETRICHOR_ENCRYPT_KEY,PETRICHOR_ENCRYPT_SALT,S3_ENDPOINT,S3_REGION,S3_BUCKET,S3_ACCESS_KEY_ID,S3_SECRET_ACCESS_KEY,NEXT_PUBLIC_APP_URL)

1. **Provision Postgres** — create a free Supabase project, copy the **Transaction Pooler** connection string (port 6543) as `DATABASE_URL`.
2. **Provision object storage** — any S3-compatible service (Bitiful / AWS S3 / MinIO). Collect endpoint, region, bucket, access key, secret.
3. **Generate secrets**:
   ```bash
   openssl rand -base64 32   # SESSION_SECRET
   openssl rand -base64 32   # PETRICHOR_ENCRYPT_KEY
   openssl rand -hex 8       # PETRICHOR_ENCRYPT_SALT
   ```
4. **Click the deploy button** above and fill the env form.
5. **Initialize the database**: run `pnpm --silent --filter @petrichor/web db:sql` (or copy [`docs/petrichor-init.sql`](docs/petrichor-init.sql)) into Supabase SQL Editor.
6. **Create the first super-admin** — the init SQL does **not** seed any user. Two options:
   - **Recommended (no SQL):** temporarily set `NEXT_PUBLIC_REGISTER_ENABLED=true` on Vercel → redeploy → register from `/login`. While no super-admin exists yet, the **first registered account automatically becomes `SUPER_ADMIN`** — no need to touch `PETRICHOR_REGISTER_DEFAULT_SYSTEM_ROLE`. Then revert the var and redeploy.
   - **Via SQL:** generate a bcrypt hash locally (`cd apps/web && node -e "console.log(require(''bcryptjs'').hashSync(''YourPwd'', 10))"`) and run [`docs/create-first-admin.sql`](docs/create-first-admin.sql) in Supabase with your email + hash filled in.
7. **Set `NEXT_PUBLIC_APP_URL`** to your deployed Vercel domain and redeploy.

### Required env

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (use Supabase Transaction Pooler in production) |
| `SESSION_SECRET` | Better Auth cookie signing key (≥ 32 chars) |
| `PETRICHOR_ENCRYPT_KEY` / `PETRICHOR_ENCRYPT_SALT` | AES-style encryption for stored AI provider API keys |
| `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Object storage for uploads (article covers, attachments, avatars) |
| `NEXT_PUBLIC_APP_URL` | Public site URL — used by RSS, share links, OAuth callbacks, SEO metadata |

### Optional env

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_REGISTER_ENABLED` | Show the "Sign up" entry on the login page (`true` / `false`) |
| `PETRICHOR_REGISTER_DEFAULT_SYSTEM_ROLE` | Default role for self-registered users — `USER` or `SUPER_ADMIN` (default `USER`). Usually unnecessary: the first account registered while no super-admin exists is auto-promoted to `SUPER_ADMIN` |
| `PETRICHOR_SESSION_EXPIRE_SECONDS` | Session lifetime in seconds (default `172800`) |
| `PETRICHOR_LINUXDO_CLIENT_ID` / `PETRICHOR_LINUXDO_CLIENT_SECRET` / `PETRICHOR_LINUXDO_REDIRECT_URI` | LinuxDo OAuth (optional third-party login) |

See the full breakdown in the [Chinese section above](#-环境变量速查表).

### Agent integration

Petrichor exposes a permissioned REST layer at `/api/agent/**` for external AI agents (Claude Code, Codex, Cursor, ChatGPT Desktop, …), together with a downloadable **Skill pack** containing a single top-level `petrichor` Skill that routes by user intent into sub-docs for setup, articles, docs, qa, share and AI generation.

1. **Generate an API key** in *Dashboard → Agent 集成 → API Key 管理* (plaintext shown once; only `sha256` is persisted).
2. **Download the Skill pack** (`petrichor-agent-skills.zip`) from the dashboard or `/api/agent/skill-pack`, then import it into your agent tool.
3. **Edit `petrichor/config.json`**: confirm `baseUrl` and paste the generated API key into `apiKey`.
4. **Call convention**: the packaged CLI reads `config.json` and sends `Authorization: Bearer <key>`.
5. **Audit**: every call (source, tool, IP, UA, request, response, status, latency) is recorded in *Dashboard → Agent 集成 → 调用日志*.

Public manifest endpoint (no auth) for capability discovery: `GET /api/agent/manifest`. Full design notes in [`docs/agent-integration.md`](docs/agent-integration.md).

### Acknowledgements

- The public-facing site''s UI and typography were inspired by [**astro-theme-retypeset**](https://github.com/radishzzz/astro-theme-retypeset) by [@radishzzz](https://github.com/radishzzz) — an elegant, reading-focused Astro blog theme with carefully crafted CJK typography.
- Thank you to the [LinuxDo](https://linux.do/) community for your support.
### License

[Apache License 2.0](LICENSE)
', NULL, NULL, '<div align="center" <img src="apps/web/public/sidebar logo.jpg" alt="Petrichor" width="120" height="120" / Petrichor 一个开...', 11, '[{"id":"petrichor","level":1,"text":"Petrichor"},{"id":"-微信交流群","level":3,"text":"💬 微信交流群"},{"id":"-简介","level":2,"text":"📖 简介"},{"id":"-功能特性","level":2,"text":"✨ 功能特性"},{"id":"-vercel-一键部署傻瓜式教程","level":2,"text":"🚀 Vercel 一键部署（傻瓜式教程）"},{"id":"第-1-步准备一个-supabase-数据库免费","level":3,"text":"第 1 步：准备一个 Supabase 数据库（免费）"},{"id":"第-2-步准备一个-s3-兼容的对象存储","level":3,"text":"第 2 步：准备一个 S3 兼容的对象存储"},{"id":"第-3-步生成必要的密钥","level":3,"text":"第 3 步：生成必要的密钥"},{"id":"第-4-步点击下方按钮一键部署","level":3,"text":"第 4 步：点击下方按钮，一键部署"},{"id":"第-5-步初始化数据库表结构只做一次","level":3,"text":"第 5 步：初始化数据库表结构（只做一次）"},{"id":"第-6-步创建第一个超级管理员账号","level":3,"text":"第 6 步：创建第一个超级管理员账号"},{"id":"方法-a临时开放注册--注册--关闭注册推荐","level":4,"text":"方法 A：临时开放注册 → 注册 → 关闭注册（推荐）"},{"id":"方法-b直接在-supabase-sql-editor-插入需要本地-node","level":4,"text":"方法 B：直接在 Supabase SQL Editor 插入（需要本地 Node）"},{"id":"第-7-步回填-next_public_app_url-并重新部署","level":3,"text":"第 7 步：回填 `NEXT_PUBLIC_APP_URL` 并重新部署"},{"id":"-环境变量速查表","level":2,"text":"🔐 环境变量速查表"},{"id":"-必填缺一不可否则启动失败","level":3,"text":"✅ 必填（缺一不可，否则启动失败）"},{"id":"-对象存储上传相关功能依赖不配则上传按钮会报错","level":3,"text":"📦 对象存储（上传相关功能依赖；不配则上传按钮会报错）"},{"id":"s3-兼容存储默认","level":4,"text":"S3 兼容存储（默认）"},{"id":"supabase-storage可选","level":4,"text":"Supabase Storage（可选）"},{"id":"-应用与公开页","level":3,"text":"🌐 应用与公开页"},{"id":"-linuxdo-oauth可选第三方登录","level":3,"text":"🔗 LinuxDo OAuth（可选第三方登录）"},{"id":"️-agent-集成skill-包--rest-能力层","level":2,"text":"🛠️ Agent 集成（Skill 包 / REST 能力层）"},{"id":"能力一览","level":3,"text":"能力一览"},{"id":"skill-包结构","level":3,"text":"Skill 包结构"},{"id":"接入步骤","level":3,"text":"接入步骤"},{"id":"-完整模板","level":3,"text":"🧪 完整模板"},{"id":"-本地开发","level":2,"text":"💻 本地开发"},{"id":"前置依赖","level":3,"text":"前置依赖"},{"id":"启动","level":3,"text":"启动"},{"id":"常用命令","level":3,"text":"常用命令"},{"id":"-项目结构","level":2,"text":"📁 项目结构"},{"id":"-贡献","level":2,"text":"🤝 贡献"},{"id":"-致谢","level":2,"text":"🙏 致谢"},{"id":"-license","level":2,"text":"📄 License"},{"id":"english","level":2,"text":"English"},{"id":"links","level":3,"text":"Links"},{"id":"quick-deploy","level":3,"text":"Quick deploy"},{"id":"required-env","level":3,"text":"Required env"},{"id":"optional-env","level":3,"text":"Optional env"},{"id":"agent-integration","level":3,"text":"Agent integration"},{"id":"acknowledgements","level":3,"text":"Acknowledgements"},{"id":"license","level":3,"text":"License"}]', '7f6b5d56c31745e66c6a9d6600cc35ad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-16 05:04:05.997703+00', '2026-07-16 05:04:05.997703+00'),
	(2, 1, 1, 2, 'AGENTS.md - 项目指南', 'test

test

tset

tset

test
', '[{"type":"p","children":[{"text":"test"}],"id":"i4SZ_LXtnN"},{"type":"p","id":"VPG4WqOYuX","children":[{"text":"test"}]},{"type":"p","id":"4gTzXFDDMV","children":[{"text":"tset"}]},{"type":"p","id":"Rt0Ivumqbd","children":[{"text":"tset"}]},{"type":"p","id":"cNs84ztVlH","children":[{"text":"test"}]}]', '{"currentUserId":"1","discussions":[],"users":{"1":{"id":"1","name":"chengxin"}}}', 'test test tset tset test', 1, '[]', '0c1dbfbb32c20a70f73ad965d71e0589', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-16 05:41:18.123404+00', '2026-07-16 05:48:18.123+00');
INSERT INTO "public"."petrichor_kb_article_share" ("id", "user_id", "article_id", "share_code", "enabled", "expires_at", "password_hash", "is_repost", "original_url", "original_author_name", "revoked_at", "created_at", "updated_at", "internal_url", "pin_order") OVERRIDING SYSTEM VALUE VALUES
	(1, 1, 2, 'UeEsC1um6r9YPrP-df7f_AP2', true, NULL, NULL, false, NULL, NULL, NULL, '2026-07-16 05:46:40.86076+00', '2026-07-16 05:48:38.077+00', NULL, NULL);
INSERT INTO "public"."petrichor_site_about_profile" ("id", "display_name", "role_title", "intro", "expertise_json", "toolkit_json", "quote", "accents_json", "contact_text", "contact_label", "contact_href", "created_at", "updated_at") VALUES
	(1, 'CiZai', 'Creative Dev & Visual Artist', '我是 CiZai，是一个普普通通的程序员。

目前就职于金山办公

我的兴趣主要在 Coding / AI 方向。

我喜欢 Minecraft。', '["Frontend Architecture","AI 应用开发","Knowledge Systems","Creative Coding"]', '["TypeScript","React","Next.js","AI","PostgreSQL","Minecraft"]', 'Code is just another medium for painting dreams.', '[{"phrase":"CiZai","style":"red","note":"yep, that''s me"},{"phrase":"程序员","style":"green","note":"just a dev"},{"phrase":"金山办公","style":"blue","note":"where I work"},{"phrase":"Coding / AI","style":"green","note":"my playground"},{"phrase":"Minecraft","style":"blue","note":"★ my comfort game"}]', '想聊点什么？随时', 'message me', 'mailto:zang@linux.do', '2026-07-16 04:57:06.110743+00', '2026-07-16 04:57:06.110743+00');
INSERT INTO "public"."petrichor_site_appearance" ("id", "public_qa_enabled", "created_at", "updated_at") VALUES
	(1, true, '2026-07-16 04:57:06.110743+00', '2026-07-16 04:57:06.110743+00');
INSERT INTO "public"."petrichor_site_project_showcase" ("id", "heading", "intro", "items_json", "created_at", "updated_at") VALUES
	(1, '开源项目', '', '[{"name":"Ech0 — self-hosted microblog","year":"2025","stack":["Go","Vue"],"stamp":"popular","stampColor":"red","blurb":"An open-source, self-hosted space for publishing and sharing your thoughts — your own little corner of the web.","repoUrl":"https://github.com/lin-snow/Ech0","siteUrl":"https://ech0.app"},{"name":"Dox — todos in terminal","year":"2026","stack":["Go","TypeScript"],"stamp":"new","stampColor":"blue","blurb":"More than a todo list: a terminal-first task manager. TUI by default, CLI for scripts — projects, an inbox, markdown notes, full-text search and multi-user invites, all from one container and a single SQLite file.","repoUrl":"https://github.com/lin-snow/dox"},{"name":"Kemate — a Vercel-like PaaS","year":"2026","stack":["Go"],"stamp":"WIP","stampColor":"green","blurb":"A platform-as-a-service taking aim at the likes of Vercel, built on a microservice architecture."}]', '2026-07-16 04:57:06.110743+00', '2026-07-16 04:57:06.110743+00');
INSERT INTO "public"."tags" ("id", "name", "slug", "description", "color", "created_at", "updated_at") VALUES
	('fd6fb263-febd-4799-bd11-d5317682e403', '科技', '科技', NULL, '#3B82F6', '2026-07-16 09:26:30.937615+00', '2026-07-16 09:26:30.937615+00'),
	('8d4bdc40-4b48-41bb-885f-b51c50317179', '美食', '美食', NULL, '#f73b96', '2026-07-16 09:26:42.801215+00', '2026-07-16 09:26:42.801215+00'),
	('4334891f-0e00-4eae-99fb-5894ddab65b5', '生活', '生活', NULL, '#EAB308', '2026-07-21 09:19:02.016159+00', '2026-07-21 09:19:02.016159+00'),
	('c695ec3a-141e-4fe3-9bcd-b6c1498b74a2', 'IT', 'it', NULL, '#A855F7', '2026-07-21 09:19:49.978653+00', '2026-07-21 09:19:49.978653+00');
INSERT INTO "public"."post_tags" ("post_id", "tag_id") VALUES
	('adf423a8-ddf9-426c-8991-19a1c6c0594c', 'fd6fb263-febd-4799-bd11-d5317682e403'),
	('91d794b2-5488-406b-a72c-0bd80a3e8b18', '4334891f-0e00-4eae-99fb-5894ddab65b5'),
	('0fb77cfd-fa5a-4ce4-bc0d-71bfe3c56f4c', 'c695ec3a-141e-4fe3-9bcd-b6c1498b74a2');
INSERT INTO "public"."site_config" ("key", "value", "updated_at") VALUES
	('site_description', 'A modern blog CMS', '2026-07-16 03:06:44.499129+00'),
	('theme_mode', 'light', '2026-07-17 11:26:59.263533+00'),
	('blog_theme', 'default', '2026-07-17 11:26:59.612442+00'),
	('ai_api_key', 'sk-t7B1Siti34H9p3GJyvlhcWIXZnK1orccyKjVwXVVvHItcR23gF0MsiemBecqdhZS', '2026-07-21 01:38:34.628737+00'),
	('locale', 'zh', '2026-07-21 01:38:38.118392+00'),
	('site_title', 'Chengxin', '2026-07-16 03:06:44.499129+00'),
	('registration_mode', 'closed', '2026-07-16 03:06:44.499129+00'),
	('ai_provider_url', 'https://opencode.ai/zen/go/v1/chat/completions', '2026-07-21 01:38:33.480486+00'),
	('ai_model', 'gpt-4o-mini', '2026-07-21 01:38:35.59502+00'),
	('ai_max_content_length', '100000', '2026-07-21 01:11:51.324547+00');
INSERT INTO "public"."user_profiles" ("user_id", "display_name", "avatar_url", "bio", "website", "role", "social_links", "created_at", "updated_at") VALUES
	('4f29a5f1-e25a-412c-ba8c-23697fe394d7', 'chengxin', NULL, NULL, NULL, 'admin', '{}', '2026-07-21 01:37:16.992811+00', '2026-07-21 01:37:16.992811+00');

SET session_replication_role = DEFAULT;
