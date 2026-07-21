# quick-press

A modern, WordPress-class blog CMS built on **Next.js + Supabase + Tiptap**.

🌐 **Live demo**: <https://blog.tech616.me>


<a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>


## Features

| Feature | Status |
|---------|--------|
| ✅ WYSIWYG editor (Tiptap) | ✅ toolbar, color picker, table operations |
| ✅ Posts + Pages management | ✅ CRUD + Markdown editor |
| ✅ Tags + Categories | ✅ custom colors, hierarchical management |
| ✅ Comments | ✅ moderation, deletion, threaded |
| ✅ User system | ✅ register/login/roles (first registrant becomes admin) |
| ✅ Theme system | ✅ 5 built-in themes + custom CSS upload |
| ✅ Plugin system | ✅ plugin registration mechanism |
| ✅ Full-text search | ✅ PostgreSQL pg_trgm |
| ✅ Media library | ✅ Supabase Storage |
| ✅ Dark mode | ✅ independent dark variant per theme |
| ✅ Docker deployment | ✅ one-command start |
| ✅ Site settings | ✅ blog name, registration mode, theme style editable in admin |
| ✅ AI summary | ✅ OpenAI-compatible API auto-extracts summary & keywords |
| ✅ Password protection | ✅ public/private/password-protected posts with share links |
| ✅ MCP integration | ✅ manage posts from Claude Code / Cursor via MCP |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Editor**: Tiptap (ProseMirror)
- **Styling**: Tailwind CSS v4 + CSS variable theming

## Remote Quick Deploy (Vercel)

> The whole process takes about **5–10 minutes**. No coding required — just copy and paste.

### Preparation

### Fork project

Fork the quick-press repository to your GitHub account.


### Supabase Setup

#### Step 1: Create a Supabase project (free tier)

1. Go to <https://supabase.com>, sign up and log in.
2. Click **New Project**, enter a project name (e.g. `quick-press`), set a database password — **save the password**.
3. Wait for the database to initialize (about 1–2 minutes).

#### Step 2: Get three environment variables from Supabase

| Variable | Where to find |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | In the project dashboard, click **Connect** at the top, copy from the modal. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same as above. |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys. Switch to the **"Legacy anon, service role API Keys"** tab. Copy the `service_role` key. |

#### Step 3: Initialize the database schema (one-time)

Choose one of two options:

**Option A: Supabase Studio SQL Editor (recommended, no CLI needed)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Copy the entire content of [`supabase/init.sql`](../../supabase/init.sql) into the editor
3. Click **Run**

**Option B: Supabase CLI (for automation workflows)**

- Install [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) locally:

```bash

npm install supabase --save-dev

# or: pnpm add -D supabase / yarn add -D supabase / bun add -D supabase

```

- Push to your remote project:

```bash

supabase login

supabase projects list   # the second column is your project-ref

supabase link --project-ref [project-ref]

supabase db push

```

> **💡 Note**: The steps above do **not require `supabase start`** (which downloads ~1GB of Docker images). Installing the CLI + `link` + `db push` is all you need — ~50MB disk space.


**Verify the Storage buckets were created (run in CLI or SQL Editor):**


```bash

supabase db query "select * from storage.buckets;"

-- In SQL Editor: select * from storage.buckets;

```

Expected output: two buckets — `media` and `themes`.

### Vercel Deployment

1. Go to <https://vercel.com>, sign up and log in.
2. Click **Add New → Project**, import the quick-press repository from GitHub.
3. In the **Environment Variables** section, add the three Supabase variables from Step 2.
4. Deploy.

### First-Time Setup

#### 1. Register the admin account

- The site starts with open registration.
- Go to `https://[your-domain]/login` and register.
- 🎯 **The first registered user automatically becomes admin.** No manual configuration needed.
- 🎯 Subsequent registrations default to `subscriber`.

#### 2. Close registration (recommended)

- Log in as admin, go to **Admin → Settings**.
- Set **Registration mode** to **Closed**.

**Done!** 🎉 Log in with the admin account and start using quick-press.

## Configure Your Own Domain

### Bind a Custom Domain on Vercel

1. Go to your quick-press project on Vercel.
2. Click the **Domains** menu, then click **Add Existing**.
3. Enter your domain:

   - For `www` and root domain:
     ```
     www.xxx.xyz
     xxx.xyz
     ```
   - For a subdomain:
     ```
     [sub].xxx.xyz
     ```

4. In the Domains list, open the newly added domain and copy the **CNAME Value**.
5. Go to your DNS provider (e.g. Cloudflare), open your domain's DNS settings, and add a record:

   | Field | Value |
   |-------|-------|
   | Type | `CNAME` |
   | Name | Your subdomain (e.g. `www` or `[sub]`) |
   | Target | The CNAME Value copied in the previous step |

   The change takes effect immediately after saving.

6. Visit the bound domain to verify.

## Usage

### Roles & Permissions

| Role | Level | Permissions |
|------|-------|-------------|
| admin | 3 | Full access: manage users & system settings |
| subscriber | 0 | Login, comment, manage own profile |

Admins can change other users' roles in **Admin → User Management**.

With registration enabled, 2 more roles are available:

| Role | Level | Permissions |
|------|-------|-------------|
| author | 1 | Create/edit own posts |
| editor | 2 | Manage all posts/pages/comments/tags/themes/media |

### Admin Site Settings

After logging in as admin, you can edit in **Admin → Settings**:

- **Site title**: blog name shown in the header and browser tab
- **Registration mode**: open / invite-only / closed
- **Appearance mode**: light / dark / system
- **Theme style**: 5 built-in themes + custom CSS
- **AI config**: provider URL, API key, model, content truncation length
- **MCP API Key**: for remote post management from AI clients (Claude Code / Cursor)

Saving the site title refreshes the page and takes effect immediately.

### Admin AI Summary Config

Configure in **Admin → Settings → AI Config**:

- **Provider URL**: OpenAI-compatible API endpoint (e.g. `https://api.openai.com/v1/chat/completions`)
- **API Key**: stored server-side only, never exposed to the client
- **Model**: model name (e.g. `gpt-4o-mini`)
- **Content truncation length**: truncates article content beyond this length to stay within the model context window (default 100000 chars)

Once configured, click "Extract summary" in the post editor's right panel to auto-generate a summary and keywords.

### Built-in Themes

| Theme | Style |
|-------|-------|
| Default | Blue tone, clean and simple |
| Reading | Warm tone, serif font, reading-optimized |
| Developer | Cool gray, code-friendly |
| Minimal | Clean and minimal, focus on reading |
| Night | Deep blue-black, eye-care mode |

Switch themes or upload custom CSS in **Admin → Themes**.

### MCP Integration

quick-press supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), allowing AI clients to manage posts over MCP.

#### Get an MCP Key

Generate a key in **Admin → Settings → MCP API Key**.

#### Configure Claude Code

Edit `~/.claude/settings.json` or the project root `.mcp.json`:

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

#### Supported MCP tools

| Tool | Function |
|------|----------|
| `create_draft` | Create a post draft |
| `publish_post` | Publish or update a post |
| `list_posts` | List all posts |
| `get_post` | Get post details |
| `delete_post` | Delete a post |
| `search_posts` | Search posts |
| `get_stats` | Get blog stats (post/comment counts) |

### Post Visibility

When editing a post, the "Visibility" section in the right panel supports:

| Level | Description |
|-------|-------------|
| **Public** | Visible to everyone, appears in home/archive/search |
| **Private** | Visible only to author and admins |
| **Password protected** | Access with the correct password, shareable link supported |

The post list supports filtering and bulk-updating visibility.

## Contributing

### Prerequisites

- Node.js 20+
- pnpm
- A Supabase project (free tier is fine)
- Clone this project

```text
git clone git@github.com:[your-github-id]/quick-press.git

cd quick-press

```



### 1. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase config in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 2. Initialize the local database

> 💡 `supabase start` downloads ~1GB of Docker images and starts PostgreSQL, Auth, and other containers — expect 3–5GB disk usage. This step is only needed for local development; skip it if you only need remote deployment.

```bash

# Local dev: start Supabase and apply migrations
supabase start

supabase db reset

```

The migration automatically creates the `media` and `themes` Storage buckets.

### 3. Start the app

```bash

pnpm install

pnpm dev

```

Visit http://localhost:3000

Register an account first; the first registered user automatically becomes admin. Subsequent registrations default to subscriber.

### Docker Deployment

```bash
# Build
docker build -t quick-press .

# Run (custom port)
docker run -p 3000:3000 --env-file .env quick-press

```

Or with docker-compose:

```bash
docker compose up -d
```

Custom port:

```bash
PORT=8080 docker compose up -d
```

### Project Structure

```
quick-press/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── admin/            # Admin panel
│   │   ├── (auth)/           # Login / register
│   │   ├── (public)/         # Frontend pages
│   │   └── api/              # API routes
│   ├── server/               # Server-side 3-tier architecture
│   │   ├── actions/          # Server Actions (thin wrappers)
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access
│   │   ├── auth/             # Roles & permissions
│   │   ├── utils/            # Utilities
│   │   └── db/               # Supabase clients
│   ├── components/
│   │   ├── admin/            # Admin components
│   │   ├── blog/             # Frontend components
│   │   └── ui/               # shadcn/ui components
│   ├── models/               # Shared type definitions
│   ├── hooks/                # React Hooks
│   ├── plugins/              # Blog plugins
│   └── lib/supabase/         # Browser-side Supabase client
├── supabase/
│   ├── migrations/           # DB migrations (README + future changes)
│   │   └── README.md
│   └── init.sql              # Full initialization schema (for new DBs)
├── Dockerfile
├── docker-compose.yml
├── development.md            # Dev supplement (debugging, DB, CLI, FAQ)
├── design_v0.2.md           # Design doc
└── README.md
```

### Documentation

- [Development Supplement](development.md) — debugging, database migrations, CLI cheat sheet, FAQ
- [Design Document](design_v0.2.md) — full feature design and data model

### References

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tiptap](https://tiptap.dev/)
- [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)

### Internationalization (i18n)

The UI is internationalized with [next-intl](https://next-intl.dev). Supported locales:

- `en` — English (**default**)
- `zh` — 中文

Locale is resolved via the `NEXT_LOCALE` cookie (falling back to the `Accept-Language`
header) and does **not** change URLs, so existing links, API routes and Supabase auth
callbacks keep working unchanged.

- Switch language with the language selector in the site header and admin top bar
  (`src/components/locale-switcher.tsx`).
- Translation dictionaries live in `src/messages/{en,zh}.json`.
- Server components use `getTranslations` / `getLocale`; client components use
  `useTranslations` / `useLocale`.
- The editor toolbar is localized too — `WysiwygEditor` receives the current `locale`.

To add a language: add it to `src/i18n/routing.ts` `locales`, create
`src/messages/<locale>.json`, and extend `localeNames`.
