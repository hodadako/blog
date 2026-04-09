# Blog Monorepo

Low-cost multilingual blog architecture built around:

- **Next.js App Router** for SSR pages and admin routes
- **GitHub markdown** as the post source of truth
- **Supabase** for comments only
- **Cloudflare Worker** for quiz verification
- **Vercel** for hosting
- **Pulumi** for core infrastructure ownership

## Repository layout

```txt
apps/
  web/                      # Next.js public/admin app
content/
  posts/
    <slug>/
      ko.md
      en.md
infra/
  cloudflare-worker/
  pulumi/
  supabase/
```

## Current architecture decision

The current runtime lives in `apps/web`. Public pages, admin auth, and comment APIs live there, while post authoring stays file-based under `content/posts`.

See `docs/architecture/target-architecture.md` for the current system overview.

## Local development

```bash
pnpm install
pnpm --filter web dev
```

The web app expects the repo root to be available so it can read `content/posts/**`.

## Environment variables

### Web app

- `NEXT_PUBLIC_SITE_URL`
- `CONTENT_ROOT` (optional override)
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COMMENT_PASSWORD_PEPPER`
- `QUIZ_TOKEN_SECRET`
- `NEXT_PUBLIC_QUIZ_WORKER_URL`

### Cloudflare Worker

- `QUIZ_TOKEN_SECRET`
- `QUIZ_TTL_SECONDS`

## Content format

Posts live at `content/posts/{slug}/{locale}.md`.

Required frontmatter:

```yaml
title: "..."
description: "..."
publishedAt: "2026-03-25"
updatedAt: "2026-03-25"
tags: ["nextjs", "seo"]
draft: false
locale: "ko"
slug: "low-cost-stack"
```

## Comment flow

1. Browser fetches a quiz challenge from the Worker.
2. Worker issues a short-lived verification token on correct answer.
3. `/api/comments` verifies the token again and inserts into Supabase.
4. Edit/delete operations verify the per-comment password hash.
5. Admins can blacklist a commenter by hashed IP from the moderation screen.

SQL lives in:

- `infra/supabase/migrations/0001_comments.sql`
- `infra/supabase/migrations/0002_comment_ip_blacklist.sql`

Apply both migrations before testing admin IP blacklist controls.

## Admin flow

1. Login at `/{locale}/admin/login`
2. Password is checked against `ADMIN_PASSWORD`
3. App sets a signed cookie session
4. Admin moderates comments only

## Post publishing flow

1. Write or edit `content/posts/{slug}/{locale}.md` locally
2. Preview with `pnpm --filter web dev`
3. Commit and push through Git
4. Let Vercel deploy the repository update

## Deployment

- Vercel project should build from repo root.
- Cloudflare Worker deploys separately through Wrangler.
- Pulumi manages the core DNS/Vercel/GitHub resources under `infra/pulumi`.

## Suggested migration order

1. Convert workspace to pnpm
2. Stand up `apps/web`
3. Move or write initial markdown content under `content/posts`
4. Apply Supabase migration
5. Deploy Worker and configure `QUIZ_TOKEN_SECRET`
6. Configure admin and comment secrets
7. Point Vercel at repo root and deploy
