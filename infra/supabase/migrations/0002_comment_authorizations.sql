create table if not exists invite_tokens (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 80),
  token_hash text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create table if not exists comment_quizzes (
  canonical_slug text primary key,
  prompt text not null check (char_length(prompt) between 1 and 500),
  answer_hashes text[] not null check (cardinality(answer_hashes) between 1 and 20),
  normalization_version smallint not null default 1 check (normalization_version = 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comment_authorizations (
  id uuid primary key,
  purpose text not null check (purpose = 'COMMENT_WRITE'),
  canonical_slug text not null,
  source text not null check (source in ('quiz', 'invite')),
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  check (expires_at > issued_at)
);

create index if not exists idx_comment_authorizations_expiry
  on comment_authorizations(expires_at)
  where consumed_at is null and revoked_at is null;

create table if not exists comment_idempotency (
  idempotency_key uuid primary key,
  authorization_id uuid not null references comment_authorizations(id) on delete cascade,
  request_hash text not null,
  comment_id uuid not null references comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_comment_idempotency_expiry
  on comment_idempotency(expires_at);

create table if not exists comment_rate_limits (
  action text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (action, subject_hash, window_started_at)
);

alter table post_threads enable row level security;
alter table comments enable row level security;
alter table comment_ip_blacklist enable row level security;
alter table invite_tokens enable row level security;
alter table comment_quizzes enable row level security;
alter table comment_authorizations enable row level security;
alter table comment_idempotency enable row level security;
alter table comment_rate_limits enable row level security;

revoke all on table post_threads from public, anon, authenticated;
revoke all on table comments from public, anon, authenticated;
revoke all on table comment_ip_blacklist from public, anon, authenticated;
revoke all on table invite_tokens from public, anon, authenticated;
revoke all on table comment_quizzes from public, anon, authenticated;
revoke all on table comment_authorizations from public, anon, authenticated;
revoke all on table comment_idempotency from public, anon, authenticated;
revoke all on table comment_rate_limits from public, anon, authenticated;

drop view if exists comments_with_thread;

create view comments_with_thread
with (security_invoker = true)
as
select
  comments.id,
  comments.parent_id,
  comments.depth,
  comments.author_name,
  comments.body_markdown,
  comments.status,
  comments.deleted_at,
  comments.created_at,
  comments.updated_at,
  post_threads.canonical_slug
from comments
join post_threads on post_threads.id = comments.post_thread_id;

create or replace view comments_admin_with_thread
with (security_invoker = true)
as
select
  comments.id,
  comments.parent_id,
  comments.depth,
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

revoke all on table comments_with_thread from public, anon, authenticated;
revoke all on table comments_admin_with_thread from public, anon, authenticated;
grant select on table comments_with_thread to service_role;
grant select on table comments_admin_with_thread to service_role;

create or replace function consume_comment_rate_limit(
  input_action text,
  input_subject_hash text,
  input_limit integer,
  input_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_window timestamptz;
  next_count integer;
begin
  if input_action = '' or input_subject_hash = '' or input_limit < 1 or input_window_seconds < 1 then
    raise exception 'invalid-rate-limit-input' using errcode = '22023';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / input_window_seconds) * input_window_seconds
  );

  insert into comment_rate_limits (action, subject_hash, window_started_at, request_count)
  values (input_action, input_subject_hash, current_window, 1)
  on conflict (action, subject_hash, window_started_at)
  do update set request_count = comment_rate_limits.request_count + 1
  returning request_count into next_count;

  return next_count <= input_limit;
end;
$$;

create or replace function create_authorized_comment(
  input_authorization_id uuid,
  input_canonical_slug text,
  input_idempotency_key uuid,
  input_request_hash text,
  input_parent_id uuid,
  input_author_name text,
  input_body_markdown text,
  input_password_hash text,
  input_ip_hash text,
  input_rate_limit integer default 5,
  input_rate_window_seconds integer default 300
)
returns table (comment_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  authorization_row comment_authorizations%rowtype;
  idempotency_row comment_idempotency%rowtype;
  thread_row post_threads%rowtype;
  parent_thread_id uuid;
  parent_depth smallint;
  parent_status text;
  inserted_comment_id uuid;
begin
  select * into authorization_row
  from comment_authorizations
  where id = input_authorization_id
  for update;

  if not found then
    raise exception 'authorization-not-found' using errcode = 'P0001';
  end if;

  select * into idempotency_row
  from comment_idempotency
  where idempotency_key = input_idempotency_key;

  if found then
    if idempotency_row.authorization_id <> input_authorization_id
      or idempotency_row.request_hash <> input_request_hash then
      raise exception 'idempotency-conflict' using errcode = 'P0001';
    end if;

    return query select idempotency_row.comment_id, true;
    return;
  end if;

  if authorization_row.purpose <> 'COMMENT_WRITE'
    or authorization_row.canonical_slug <> input_canonical_slug
    or authorization_row.expires_at <= clock_timestamp()
    or authorization_row.consumed_at is not null
    or authorization_row.revoked_at is not null then
    raise exception 'authorization-invalid' using errcode = 'P0001';
  end if;

  if char_length(btrim(input_author_name)) not between 1 and 80
    or char_length(btrim(input_body_markdown)) not between 1 and 5000
    or char_length(input_password_hash) < 32
    or input_canonical_slug !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$' then
    raise exception 'invalid-comment-input' using errcode = '22023';
  end if;

  if input_ip_hash is not null then
    if exists (select 1 from comment_ip_blacklist where ip_hash = input_ip_hash) then
      raise exception 'ip-blacklisted' using errcode = 'P0001';
    end if;

    if not consume_comment_rate_limit(
      'comment:create', input_ip_hash, input_rate_limit, input_rate_window_seconds
    ) then
      raise exception 'rate-limited' using errcode = 'P0001';
    end if;
  end if;

  insert into post_threads (canonical_slug)
  values (input_canonical_slug)
  on conflict (canonical_slug) do update set canonical_slug = excluded.canonical_slug
  returning * into thread_row;

  if not thread_row.comments_open then
    raise exception 'comments-closed' using errcode = 'P0001';
  end if;

  if input_parent_id is not null then
    select post_thread_id, depth, status
      into parent_thread_id, parent_depth, parent_status
    from comments
    where id = input_parent_id;

    if not found
      or parent_thread_id <> thread_row.id
      or parent_depth <> 0
      or parent_status <> 'published' then
      raise exception 'invalid-parent-comment' using errcode = 'P0001';
    end if;
  end if;

  if input_ip_hash is not null and exists (
    select 1
    from comments
    where post_thread_id = thread_row.id
      and ip_hash = input_ip_hash
      and body_markdown = btrim(input_body_markdown)
      and status = 'published'
      and created_at > clock_timestamp() - interval '60 seconds'
  ) then
    raise exception 'duplicate-comment' using errcode = 'P0001';
  end if;

  insert into comments (
    post_thread_id,
    parent_id,
    depth,
    author_name,
    body_markdown,
    body_html,
    status,
    password_hash,
    quiz_verified_at,
    ip_hash
  ) values (
    thread_row.id,
    input_parent_id,
    case when input_parent_id is null then 0 else 1 end,
    btrim(input_author_name),
    btrim(input_body_markdown),
    btrim(input_body_markdown),
    'published',
    input_password_hash,
    clock_timestamp(),
    input_ip_hash
  ) returning id into inserted_comment_id;

  update comment_authorizations
  set consumed_at = clock_timestamp()
  where id = input_authorization_id and consumed_at is null;

  if not found then
    raise exception 'authorization-already-consumed' using errcode = 'P0001';
  end if;

  insert into comment_idempotency (
    idempotency_key,
    authorization_id,
    request_hash,
    comment_id,
    expires_at
  ) values (
    input_idempotency_key,
    input_authorization_id,
    input_request_hash,
    inserted_comment_id,
    greatest(authorization_row.expires_at, clock_timestamp() + interval '24 hours')
  );

  return query select inserted_comment_id, false;
end;
$$;

revoke all on function consume_comment_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function create_authorized_comment(uuid, text, uuid, text, uuid, text, text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function consume_comment_rate_limit(text, text, integer, integer) to service_role;
grant execute on function create_authorized_comment(uuid, text, uuid, text, uuid, text, text, text, text, integer, integer) to service_role;
