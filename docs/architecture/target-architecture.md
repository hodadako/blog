# Target Architecture

## Core structure

- `apps/web`: public pages, admin routes, and API handlers
- `content/posts/{slug}/{locale}.md`: file-backed post source of truth
- `infra/supabase`: comment schema and migrations
- `infra/cloudflare-worker`: quiz verification flow
- `infra/pulumi`: infrastructure ownership and deployment wiring
- `turbo.json`: monorepo orchestration

## Runtime choices

- Public runtime: Next.js App Router in `apps/web`
- Post storage: markdown files in `content/posts/{slug}/{locale}.md`
- Comment persistence: Supabase/Postgres
- Comment anti-spam: Worker-issued quiz pass token + server-side re-verification
- Admin access: single password + signed cookie session

## Service roles

- **Vercel**: public SSR runtime and route handlers
- **GitHub**: post source of truth and commit history
- **Supabase**: comment storage only
- **Cloudflare Worker**: quiz challenge and token issuance
- **Pulumi**: DNS, Worker, Vercel project/domain, selected secret wiring

## Routing

- Public: `/{locale}`
- Archive: `/{locale}/blog`
- Detail: `/{locale}/blog/{slug}`
- Admin login: `/{locale}/admin/login`
- Admin editor: `/{locale}/admin`
- Admin comments: `/{locale}/admin/comments`

## Data flow

1. Public page request lands on Vercel.
2. Next.js reads markdown from `content/posts`.
3. `generateMetadata` and `sitemap.ts` derive SEO output from frontmatter.
4. Comment form fetches a challenge from Cloudflare Worker.
5. Worker verifies the answer and returns a signed pass token.
6. Next.js route re-verifies the token and writes the comment to Supabase.
7. Admin post updates are reflected in file-backed content workflows.

## Deliberate simplifications

- Same canonical slug across locales
- One-level replies only
- No user accounts
- No separate CMS
- No always-on server or dedicated database for posts
