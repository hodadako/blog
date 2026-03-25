alter table comments
  add column if not exists ip_hash text null;

create index if not exists idx_comments_ip_hash
  on comments(ip_hash)
  where ip_hash is not null;

create table if not exists comment_ip_blacklist (
  ip_hash text primary key,
  source_comment_id uuid null references comments(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace view comments_with_thread as
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
  comment_threads.canonical_slug
from comments
join comment_threads on comment_threads.id = comments.thread_id;
