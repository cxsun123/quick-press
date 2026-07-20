# quick-press

A modern, WordPress-class blog CMS built on **Next.js + Supabase + Tiptap**.

🌐 **Live demo**: [https://md.tech616.me](https://md.tech616.me)

📖 **中文文档**: [README.zh-CN.md](README.zh-CN.md)

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

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- A Supabase project (free tier is fine)

### 1. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase config in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Initialize the database

```bash
# Local dev: start Supabase and apply migrations
supabase start
supabase db reset

# Production: link the remote project and push migrations
supabase link --project-ref <project_ref>
supabase db push
```

The migration automatically creates the `media` Storage bucket.

### 3. Start the app

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

Register an account first; the first registered user automatically becomes admin. Subsequent registrations default to subscriber.

## Roles & Permissions

| Role | Level | Permissions |
|------|-------|-------------|
| subscriber | 0 | Login, comment, manage own profile |
| author | 1 | Create/edit own posts |
| editor | 2 | Manage all posts/pages/comments/tags/themes/media |
| admin | 3 | Full access: manage users & system settings |

Admins can change other users' roles in **Admin → User Management**.

## Site Settings

After logging in as admin, you can edit in **Admin → Settings**:

- **Site title**: blog name shown in the header and browser tab
- **Registration mode**: open / invite-only / closed
- **Appearance mode**: light / dark / system
- **Theme style**: 5 built-in themes + custom CSS
- **AI config**: provider URL, API key, model, content truncation length
- **MCP API Key**: for remote post management from AI clients (Claude Code / Cursor)

Saving the site title refreshes the page and takes effect immediately.

## AI Summary

Configure in **Admin → Settings → AI Config**:

- **Provider URL**: OpenAI-compatible API endpoint (e.g. `https://api.openai.com/v1/chat/completions`)
- **API Key**: stored server-side only, never exposed to the client
- **Model**: model name (e.g. `gpt-4o-mini`)
- **Content truncation length**: truncates article content beyond this length to stay within the model context window (default 100000 chars)

Once configured, click "Extract summary" in the post editor's right panel to auto-generate a summary and keywords.

## MCP Integration

quick-press supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), allowing AI clients to manage posts over MCP.

### Get an MCP Key

Generate a key in **Admin → Settings → MCP API Key**.

### Configure Claude Code

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

### Supported MCP tools

| Tool | Function |
|------|----------|
| `create_draft` | Create a post draft |
| `publish_post` | Publish or update a post |
| `list_posts` | List all posts |
| `get_post` | Get post details |
| `delete_post` | Delete a post |
| `search_posts` | Search posts |
| `get_stats` | Get blog stats (post/comment counts) |

## Post Visibility

When editing a post, the "Visibility" section in the right panel supports:

| Level | Description |
|-------|-------------|
| **Public** | Visible to everyone, appears in home/archive/search |
| **Private** | Visible only to author and admins |
| **Password protected** | Access with the correct password, shareable link supported |

The post list supports filtering and bulk-updating visibility.

## Docker Deployment

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

## Built-in Themes

| Theme | Style |
|-------|-------|
| Default | Blue tone, clean and simple |
| Reading | Warm tone, serif font, reading-optimized |
| Developer | Cool gray, code-friendly |
| Minimal | Clean and minimal, focus on reading |
| Night | Deep blue-black, eye-care mode |

Switch themes or upload custom CSS in **Admin → Themes**.

## Project Structure

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
│   ├── migrations/           # Database migrations
│   └── init.sql              # Initial schema
├── Dockerfile
├── docker-compose.yml
├── development.md            # Dev & deployment guide
├── design_v0.2.md           # Design doc
└── README.md
```

## Documentation

- [Development & Deployment Guide](development.md) — local dev, Supabase config, Vercel deploy, env vars
- [Design Document](design_v0.2.md) — full feature design and data model

## References

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tiptap](https://tiptap.dev/)
- [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog)
