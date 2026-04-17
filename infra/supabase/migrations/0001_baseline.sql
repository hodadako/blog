create extension if not exists pgcrypto;

create table if not exists post_threads (
  id uuid primary key default gen_random_uuid(),
  canonical_slug text not null unique,
  comments_open boolean not null default true,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_thread_id uuid not null references post_threads(id) on delete cascade,
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
  ip_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_post_thread_top_level
  on comments(post_thread_id, created_at asc)
  where parent_id is null and status in ('published', 'deleted');

create index if not exists idx_comments_parent_active
  on comments(parent_id, created_at asc)
  where status in ('published', 'deleted');

create index if not exists idx_comments_post_thread_status_created
  on comments(post_thread_id, status, created_at desc);

create index if not exists idx_comments_ip_hash
  on comments(ip_hash)
  where ip_hash is not null;

create table if not exists comment_ip_blacklist (
  ip_hash text primary key,
  source_comment_id uuid null references comments(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function increment_post_view_count(input_canonical_slug text)
returns integer
language plpgsql
as $$
declare
  next_count integer;
begin
  insert into post_threads (canonical_slug, view_count)
  values (input_canonical_slug, 1)
  on conflict (canonical_slug)
  do update set view_count = post_threads.view_count + 1
  returning view_count into next_count;

  return next_count;
end;
$$;

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
  comments.ip_hash,
  post_threads.canonical_slug
from comments
join post_threads on post_threads.id = comments.post_thread_id;
