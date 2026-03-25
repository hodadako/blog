create extension if not exists pgcrypto;

create table if not exists comment_threads (
  id uuid primary key default gen_random_uuid(),
  canonical_slug text not null unique,
  comments_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references comment_threads(id) on delete cascade,
  parent_id uuid null references comments(id),
  depth smallint not null default 0 check (depth between 0 and 1),
  author_name text not null,
  body_markdown text not null,
  body_html text not null,
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  deleted_at timestamptz null,
  password_hash text not null,
  quiz_verified_at timestamptz not null,
  anon_id text null,
  fingerprint_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_thread_top_level
  on comments(thread_id, created_at asc)
  where parent_id is null and status in ('published', 'deleted');

create index if not exists idx_comments_parent_active
  on comments(parent_id, created_at asc)
  where status in ('published', 'deleted');

create index if not exists idx_comments_thread_status_created
  on comments(thread_id, status, created_at desc);

create view comments_with_thread as
select
  comments.id,
  comments.parent_id,
  comments.author_name,
  comments.body_markdown,
  comments.status,
  comments.deleted_at,
  comments.created_at,
  comments.updated_at,
  comments.password_hash,
  comment_threads.canonical_slug
from comments
join comment_threads on comment_threads.id = comments.thread_id;
