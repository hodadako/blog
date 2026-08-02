# Target Architecture

## Core structure

- `apps/web`: public pages, admin routes, comment authorization, and comment API handlers
- `content/posts/{slug}/{locale}.md`: file-backed post source of truth
- `infra/supabase`: comments, quizzes, invite tokens, one-time authorizations, idempotency, and rate limits
- `infra/cloudflare-worker`: fallback arithmetic challenge issuance
- `infra/pulumi`: infrastructure ownership and deployment wiring

## Runtime choices

- Public runtime: Next.js App Router in `apps/web`
- Post storage: markdown files in `content/posts/{slug}/{locale}.md`
- Comment persistence and atomic authorization consumption: Supabase/Postgres
- Comment authentication: configured post quiz or reusable invite token exchanged for a five-minute, one-use authorization
- Fallback challenge: Worker-issued signed arithmetic challenge when a post has no configured quiz
- Admin access: single password + signed cookie session

## Service roles

- **Vercel**: validates published posts, verifies quiz/invite credentials, issues signed comment authorizations, and handles comment CRUD
- **GitHub**: post source of truth and commit history
- **Supabase**: comment threads, comments, quiz answer HMACs, invite token HMACs, authorization state, idempotency, persistent rate limits, and blacklist
- **Cloudflare Worker**: issues short-lived fallback quiz challenges without embedding an `answer` claim
- **Pulumi**: DNS and selected GitHub secret wiring

The Supabase service-role key remains only in the Next.js server runtime. The browser and Worker do not receive it. RLS and explicit grants deny direct `anon`/`authenticated` writes.

## Routing

- Public: `/{locale}`
- Archive: `/{locale}/blog`
- Detail: `/{locale}/blog/{slug}`
- Comment authorization: `GET|POST /api/comment-authorizations`
- Comment create: `POST /api/comments`
- Comment edit/delete: `POST /api/comments/{id}`
- Admin login: `/{locale}/admin/login`
- Admin editor: `/{locale}/admin`
- Admin comments, quizzes, and invite tokens: `/{locale}/admin/comments`

## Comment authorization flow

1. The form calls `GET /api/comment-authorizations?canonicalSlug=...`.
2. Next.js verifies the canonical slug maps to at least one published Markdown post.
3. If an active DB-backed quiz exists, the API returns only its prompt. Otherwise the form fetches a signed arithmetic challenge from the Worker.
4. The reader submits exactly one credential to `POST /api/comment-authorizations`:
   - quiz answer and, for fallback quizzes, the signed challenge token; or
   - a reusable global invite token.
5. The API applies a persistent IP-subject rate limit and validates the credential. Configured quiz answers and invite tokens are stored only as HMACs.
6. The API inserts a `comment_authorizations` row and returns a signed five-minute token containing `purpose`, `canonicalSlug`, `jti`, `iat`, and `exp`.
7. The form submits the comment, authorization token, and client-generated UUID `idempotencyKey` to `POST /api/comments`.
8. Next.js validates the token signature, purpose, slug, shape, and expiry.
9. The `create_authorized_comment` Postgres function locks the authorization row and atomically:
   - returns the prior comment for a matching idempotent retry;
   - rejects a reused, expired, revoked, or mismatched authorization;
   - enforces blacklist, rate limit, open thread, same-thread parent, and depth-zero parent rules;
   - inserts the comment, consumes the authorization, and records the idempotency result.
10. Any transaction failure rolls back the comment, authorization consumption, and idempotency record together.

## Credential policies

- Comment authorizations are purpose-limited, canonical-slug-bound, signed, five minutes long, and one-use.
- Invite tokens are 256-bit random values, global, reusable, and revocable. Only their HMACs are stored; plaintext is shown once at issuance.
- Configured quiz answers use normalization version 1: Unicode NFKC, trim, repeated-whitespace collapse, and locale-aware lowercase. Punctuation is preserved. Up to 20 accepted answers are supported.
- Posts without an active configured quiz use the Worker arithmetic fallback.
- Comment passwords use random salt + server pepper + scrypt and are never returned by public views.
- IP identifiers use a separate HMAC secret when configured; `COMMENT_PASSWORD_PEPPER` is a compatibility fallback.

## Data access and abuse controls

- The browser has no Supabase client and all dynamic writes go through Next.js.
- Comment tables have RLS enabled and no `anon`/`authenticated` table privileges.
- Public comment projections exclude password and IP hashes.
- Authorization, challenge, create, edit, and delete attempts use persistent database rate-limit counters.
- Vercel's trusted forwarded-IP header is preferred; arbitrary `X-Forwarded-For` is not trusted in production.
- Replies are restricted to a published depth-zero parent in the same canonical thread.
- Deletes are soft deletes so replies remain visible below a `[deleted]` placeholder.

## Deliberate simplifications

- Same canonical slug across locales
- One-level replies only
- No reader accounts
- No separate CMS
- No always-on server or database-backed post entities
- Next.js remains the database enforcement point so the Supabase service-role secret is not duplicated into the Worker
