-- Category-based, five-option comment quiz bank.
-- All quiz/challenge/authorization writes are exposed only through service-role RPCs.

create table if not exists quiz_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and char_length(code) between 2 and 32 and code ~ '^[A-Z][A-Z0-9_]*$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references quiz_categories(id) on delete restrict,
  type text not null check (type in ('TEXT_MULTIPLE_CHOICE', 'IMAGE_MULTIPLE_CHOICE')),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  explanation text not null default '' check (char_length(explanation) <= 2000),
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  active boolean not null default true,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quiz_questions_category_active
  on quiz_questions(category_id, active, difficulty);

create table if not exists quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  text text null,
  image_path text null,
  alt_text text null,
  label text null,
  is_correct boolean not null default false,
  display_order smallint not null check (display_order between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, display_order),
  check (text is null or char_length(text) <= 500),
  check (image_path is null or (char_length(image_path) <= 400 and image_path ~ '^[A-Za-z0-9][A-Za-z0-9._/-]*$' and image_path !~ '(^|/)[.][.]?(/|$)')),
  check (alt_text is null or char_length(alt_text) between 1 and 240),
  check (label is null or char_length(label) between 1 and 120)
);

create index if not exists idx_quiz_options_question_order
  on quiz_options(question_id, display_order);

alter table post_threads
  add column if not exists quiz_category_id uuid references quiz_categories(id) on delete set null;

create index if not exists idx_post_threads_quiz_category
  on post_threads(quiz_category_id)
  where quiz_category_id is not null;

create table if not exists quiz_challenges (
  id uuid primary key default gen_random_uuid(),
  canonical_slug text not null check (char_length(canonical_slug) between 1 and 200 and canonical_slug ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$'),
  category_id uuid not null references quiz_categories(id) on delete restrict,
  question_id uuid not null references quiz_questions(id) on delete restrict,
  question_version integer not null check (question_version > 0),
  correct_option_id uuid not null references quiz_options(id) on delete restrict,
  allowed_option_ids uuid[] not null check (cardinality(allowed_option_ids) = 5),
  status text not null default 'PENDING' check (status in ('PENDING', 'FAILED', 'VERIFIED', 'EXPIRED')),
  attempt_count smallint not null default 0 check (attempt_count between 0 and 1),
  requester_ip_hash text null check (requester_ip_hash is null or requester_ip_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  verified_at timestamptz null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists idx_quiz_challenges_pending_expiry
  on quiz_challenges(expires_at)
  where status = 'PENDING';

create table if not exists comment_idempotencies_v2 (
  idempotency_key uuid primary key,
  authorization_id uuid not null references comment_authorizations(id) on delete cascade,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  comment_id uuid not null references comments(id) on delete cascade,
  status text not null default 'COMPLETED' check (status = 'COMPLETED'),
  response_body jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comment_idempotencies_v2_expiry
  on comment_idempotencies_v2(expires_at);

alter table quiz_categories enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_challenges enable row level security;
alter table comment_idempotencies_v2 enable row level security;

revoke all on table quiz_categories from public, anon, authenticated;
revoke all on table quiz_questions from public, anon, authenticated;
revoke all on table quiz_options from public, anon, authenticated;
revoke all on table quiz_challenges from public, anon, authenticated;
revoke all on table comment_idempotencies_v2 from public, anon, authenticated;

grant select, insert, update, delete on table quiz_categories to service_role;
grant select, insert, update, delete on table quiz_questions to service_role;
grant select, insert, update, delete on table quiz_options to service_role;
grant select, insert, update, delete on table quiz_challenges to service_role;
grant select, insert, update, delete on table comment_idempotencies_v2 to service_role;
grant select, insert, update, delete on table post_threads to service_role;
grant select, insert, update, delete on table comments to service_role;
grant select, insert, update, delete on table comment_ip_blacklist to service_role;
grant select, insert, update, delete on table invite_tokens to service_role;
grant select, insert, update, delete on table comment_authorizations to service_role;

create or replace function validate_quiz_question_options()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_question_id uuid;
  question_type text;
  question_active boolean;
  option_count integer;
  correct_count integer;
  invalid_content boolean;
begin
  if tg_table_name = 'quiz_questions' then
    target_question_id := coalesce(new.id, old.id);
  elsif tg_op = 'DELETE' then
    target_question_id := (to_jsonb(old)->>'question_id')::uuid;
  else
    target_question_id := (to_jsonb(new)->>'question_id')::uuid;
  end if;

  select type, active
    into question_type, question_active
  from quiz_questions
  where id = target_question_id;

  if not found or not question_active then
    return null;
  end if;

  select count(*)::integer, count(*) filter (where is_correct)::integer
    into option_count, correct_count
  from quiz_options
  where question_id = target_question_id;

  if option_count <> 5 or correct_count <> 1 then
    raise exception 'quiz-question-must-have-five-options-and-one-answer' using errcode = '23514';
  end if;

  select exists (
    select 1
    from quiz_options
    where question_id = target_question_id
      and (
        (question_type = 'TEXT_MULTIPLE_CHOICE' and nullif(btrim(text), '') is null)
        or (question_type = 'IMAGE_MULTIPLE_CHOICE' and (nullif(btrim(image_path), '') is null or nullif(btrim(alt_text), '') is null))
      )
  ) into invalid_content;

  if invalid_content then
    raise exception 'quiz-option-content-does-not-match-question-type' using errcode = '23514';
  end if;

  return null;
end;
$$;

drop trigger if exists quiz_questions_option_shape on quiz_questions;
create constraint trigger quiz_questions_option_shape
after insert or update of active, type on quiz_questions
deferrable initially deferred
for each row execute function validate_quiz_question_options();

drop trigger if exists quiz_options_option_shape on quiz_options;
create constraint trigger quiz_options_option_shape
after insert or update or delete on quiz_options
deferrable initially deferred
for each row execute function validate_quiz_question_options();

insert into quiz_categories (code, name, description)
values
  ('DEVOPS', 'DevOps', '운영과 배포, 컨테이너, 클라우드 문제'),
  ('BACKEND', 'Backend', '백엔드와 HTTP 문제'),
  ('FRONTEND', 'Frontend', '브라우저와 UI 문제'),
  ('DATABASE', 'Database', '데이터베이스 문제'),
  ('MUSIC', 'Music', '음악 문제'),
  ('GENERAL', 'General', '일반 문제')
on conflict (code) do update set name = excluded.name, description = excluded.description, updated_at = now();

insert into post_threads (canonical_slug, quiz_category_id)
select values_table.canonical_slug, quiz_categories.id
from (values
  ('2025-retrospective', 'GENERAL'),
  ('gave-up-bean-validation', 'BACKEND')
) as values_table(canonical_slug, category_code)
join quiz_categories on quiz_categories.code = values_table.category_code
on conflict (canonical_slug) do update
set quiz_category_id = excluded.quiz_category_id;

with category as (select id from quiz_categories where code = 'DEVOPS')
insert into quiz_questions (category_id, type, prompt, explanation, difficulty)
select category.id, 'TEXT_MULTIPLE_CHOICE', '다음 중 Kubernetes API Object가 아닌 것은?', 'Helm Chart는 패키지 관리자/템플릿 도구이며 Kubernetes API Object가 아닙니다.', 1
from category
where not exists (
  select 1 from quiz_questions where prompt = '다음 중 Kubernetes API Object가 아닌 것은?'
);

with question as (
  select id from quiz_questions where prompt = '다음 중 Kubernetes API Object가 아닌 것은?'
)
insert into quiz_options (question_id, text, label, is_correct, display_order)
select question.id, item.text, item.label, item.is_correct, item.display_order
from question
cross join (values
  ('Pod', 'Pod', false, 1),
  ('Deployment', 'Deployment', false, 2),
  ('Service', 'Service', false, 3),
  ('ConfigMap', 'ConfigMap', false, 4),
  ('Helm Chart', 'Helm Chart', true, 5)
) as item(text, label, is_correct, display_order)
where not exists (select 1 from quiz_options existing where existing.question_id = question.id);

with category as (select id from quiz_categories where code = 'BACKEND')
insert into quiz_questions (category_id, type, prompt, explanation, difficulty)
select category.id, 'TEXT_MULTIPLE_CHOICE', '다음 중 HTTP의 멱등 메서드가 아닌 것은?', 'POST는 일반적으로 멱등 메서드가 아닙니다.', 1
from category
where not exists (
  select 1 from quiz_questions where prompt = '다음 중 HTTP의 멱등 메서드가 아닌 것은?'
);

with question as (
  select id from quiz_questions where prompt = '다음 중 HTTP의 멱등 메서드가 아닌 것은?'
)
insert into quiz_options (question_id, text, label, is_correct, display_order)
select question.id, item.text, item.label, item.is_correct, item.display_order
from question
cross join (values
  ('GET', 'GET', false, 1),
  ('PUT', 'PUT', false, 2),
  ('DELETE', 'DELETE', false, 3),
  ('HEAD', 'HEAD', false, 4),
  ('POST', 'POST', true, 5)
) as item(text, label, is_correct, display_order)
where not exists (select 1 from quiz_options existing where existing.question_id = question.id);

with category as (select id from quiz_categories where code = 'DATABASE')
insert into quiz_questions (category_id, type, prompt, explanation, difficulty)
select category.id, 'TEXT_MULTIPLE_CHOICE', '다음 중 일반적인 관계형 데이터베이스의 JOIN 종류가 아닌 것은?', 'CASCADE JOIN은 일반적인 SQL JOIN 종류가 아닙니다.', 1
from category
where not exists (
  select 1 from quiz_questions where prompt = '다음 중 일반적인 관계형 데이터베이스의 JOIN 종류가 아닌 것은?'
);

with question as (
  select id from quiz_questions where prompt = '다음 중 일반적인 관계형 데이터베이스의 JOIN 종류가 아닌 것은?'
)
insert into quiz_options (question_id, text, label, is_correct, display_order)
select question.id, item.text, item.label, item.is_correct, item.display_order
from question
cross join (values
  ('INNER JOIN', 'INNER JOIN', false, 1),
  ('LEFT JOIN', 'LEFT JOIN', false, 2),
  ('RIGHT JOIN', 'RIGHT JOIN', false, 3),
  ('FULL OUTER JOIN', 'FULL OUTER JOIN', false, 4),
  ('CASCADE JOIN', 'CASCADE JOIN', true, 5)
) as item(text, label, is_correct, display_order)
where not exists (select 1 from quiz_options existing where existing.question_id = question.id);

-- A rights-safe image-question scaffold. It stays inactive until the owner adds
-- licensed images to GitHub under opaque paths and activates the question.
with category as (select id from quiz_categories where code = 'MUSIC')
insert into quiz_questions (category_id, type, prompt, explanation, active, difficulty)
select category.id, 'IMAGE_MULTIPLE_CHOICE', '음악 이미지를 보고 알맞은 설명을 고르세요.', '', false, 1
from category
where not exists (
  select 1 from quiz_questions where prompt = '음악 이미지를 보고 알맞은 설명을 고르세요.'
);

with question as (
  select id from quiz_questions where prompt = '음악 이미지를 보고 알맞은 설명을 고르세요.'
)
insert into quiz_options (question_id, image_path, alt_text, label, is_correct, display_order)
select question.id, item.image_path, '음악 이미지 선택지', item.label, item.is_correct, item.display_order
from question
cross join (values
  ('quiz/music/placeholder/0a91f2c4.webp', '선택지 A', false, 1),
  ('quiz/music/placeholder/19b4d6e8.webp', '선택지 B', false, 2),
  ('quiz/music/placeholder/2f70c1aa.webp', '선택지 C', false, 3),
  ('quiz/music/placeholder/4d8a21f0.webp', '선택지 D', false, 4),
  ('quiz/music/placeholder/7c3e5b19.webp', '선택지 E', true, 5)
) as item(image_path, label, is_correct, display_order)
where not exists (select 1 from quiz_options existing where existing.question_id = question.id);

create or replace function issue_quiz_challenge(
  input_canonical_slug text,
  input_requester_ip_hash text,
  input_ttl_seconds integer default 300
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  thread_row post_threads%rowtype;
  category_row quiz_categories%rowtype;
  question_row quiz_questions%rowtype;
  option_rows jsonb;
  option_ids uuid[];
  correct_id uuid;
  challenge_id uuid;
  expires_at_value timestamptz;
begin
  if input_canonical_slug is null or char_length(input_canonical_slug) > 200 or input_canonical_slug !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$' then
    raise exception 'invalid-canonical-slug' using errcode = '22023';
  end if;

  select * into thread_row from post_threads where canonical_slug = input_canonical_slug;
  if not found or not thread_row.comments_open then
    raise exception 'post-not-found' using errcode = 'P0001';
  end if;

  if thread_row.quiz_category_id is null then
    select * into category_row from quiz_categories where code = 'GENERAL' and active;
  else
    select * into category_row from quiz_categories where id = thread_row.quiz_category_id and active;
  end if;

  if not found then
    raise exception 'no-quiz-available' using errcode = 'P0001';
  end if;

  select * into question_row
  from quiz_questions
  where category_id = category_row.id and active
  order by random()
  limit 1;

  if not found then
    raise exception 'no-quiz-available' using errcode = 'P0001';
  end if;

  select array_agg(id order by random())
    into option_ids
  from quiz_options
  where question_id = question_row.id;

  select id into correct_id
  from quiz_options
  where question_id = question_row.id and is_correct
  limit 1;

  if coalesce(cardinality(option_ids), 0) <> 5 or correct_id is null then
    raise exception 'invalid-quiz-question' using errcode = 'P0001';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', id,
    'text', text,
    'imagePath', image_path,
    'altText', alt_text,
    'label', label
  ) order by array_position(option_ids, id))
    into option_rows
  from quiz_options
  where id = any(option_ids);

  expires_at_value := clock_timestamp() + least(greatest(coalesce(input_ttl_seconds, 300), 60), 900) * interval '1 second';
  insert into quiz_challenges (
    canonical_slug, category_id, question_id, question_version, correct_option_id,
    allowed_option_ids, requester_ip_hash, expires_at
  ) values (
    input_canonical_slug, category_row.id, question_row.id, question_row.version, correct_id,
    option_ids, input_requester_ip_hash, expires_at_value
  ) returning id into challenge_id;

  return jsonb_build_object(
    'challengeId', challenge_id,
    'category', jsonb_build_object('code', category_row.code, 'name', category_row.name),
    'question', jsonb_build_object('type', question_row.type, 'prompt', question_row.prompt),
    'options', option_rows,
    'expiresAt', expires_at_value
  );
end;
$$;

create or replace function verify_quiz_challenge_and_issue_authorization(
  input_challenge_id uuid,
  input_selected_option_id uuid,
  input_requester_ip_hash text,
  input_ttl_seconds integer default 300
)
returns table (authorization_id uuid, canonical_slug text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  challenge_row quiz_challenges%rowtype;
  authorization_id_value uuid;
  authorization_expires timestamptz;
begin
  select * into challenge_row
  from quiz_challenges
  where id = input_challenge_id
  for update;

  if not found then
    raise exception 'challenge-not-found' using errcode = 'P0001';
  end if;

  if challenge_row.status <> 'PENDING' or challenge_row.expires_at <= clock_timestamp() then
    update quiz_challenges set status = 'EXPIRED' where id = challenge_row.id and status = 'PENDING';
    raise exception 'challenge-expired-or-used' using errcode = 'P0001';
  end if;

  if not (input_selected_option_id = any(challenge_row.allowed_option_ids)) then
    update quiz_challenges set status = 'FAILED', attempt_count = 1 where id = challenge_row.id;
    raise exception 'quiz-option-not-allowed' using errcode = 'P0001';
  end if;

  update quiz_challenges
  set attempt_count = 1
  where id = challenge_row.id;

  if input_selected_option_id <> challenge_row.correct_option_id then
    update quiz_challenges set status = 'FAILED' where id = challenge_row.id;
    raise exception 'quiz-answer-incorrect' using errcode = 'P0001';
  end if;

  authorization_expires := clock_timestamp() + least(greatest(coalesce(input_ttl_seconds, 300), 60), 900) * interval '1 second';
  update quiz_challenges
  set status = 'VERIFIED', verified_at = clock_timestamp()
  where id = challenge_row.id and status = 'PENDING';

  if not found then
    raise exception 'challenge-expired-or-used' using errcode = 'P0001';
  end if;

  insert into comment_authorizations (
    id, purpose, canonical_slug, source, issued_at, expires_at
  ) values (
    gen_random_uuid(), 'COMMENT_WRITE', challenge_row.canonical_slug, 'quiz', clock_timestamp(), authorization_expires
  ) returning id into authorization_id_value;

  return query select authorization_id_value, challenge_row.canonical_slug, authorization_expires;
end;
$$;

create or replace function issue_invite_comment_authorization(
  input_canonical_slug text,
  input_token_hash text,
  input_ttl_seconds integer default 300
)
returns table (authorization_id uuid, canonical_slug text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  authorization_id_value uuid;
  authorization_expires timestamptz;
begin
  if not exists (select 1 from post_threads where canonical_slug = input_canonical_slug and comments_open) then
    raise exception 'post-not-found' using errcode = 'P0001';
  end if;

  if not exists (select 1 from invite_tokens where token_hash = input_token_hash and is_active and revoked_at is null) then
    raise exception 'invalid-invite-token' using errcode = 'P0001';
  end if;

  authorization_expires := clock_timestamp() + least(greatest(coalesce(input_ttl_seconds, 300), 60), 900) * interval '1 second';
  insert into comment_authorizations (
    id, purpose, canonical_slug, source, issued_at, expires_at
  ) values (
    gen_random_uuid(), 'COMMENT_WRITE', input_canonical_slug, 'invite', clock_timestamp(), authorization_expires
  ) returning id into authorization_id_value;

  return query select authorization_id_value, input_canonical_slug, authorization_expires;
end;
$$;

create or replace function create_comment_with_authorization(
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
returns table (comment_id uuid, replayed boolean, response_body jsonb)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  authorization_row comment_authorizations%rowtype;
  idempotency_row comment_idempotencies_v2%rowtype;
  thread_row post_threads%rowtype;
  parent_thread_id uuid;
  parent_depth smallint;
  parent_status text;
  inserted_comment_id uuid;
  result_body jsonb;
begin
  select * into authorization_row
  from comment_authorizations
  where id = input_authorization_id
  for update;

  if not found then
    raise exception 'authorization-not-found' using errcode = 'P0001';
  end if;

  select * into idempotency_row
  from comment_idempotencies_v2
  where idempotency_key = input_idempotency_key
  for update;

  if found then
    if idempotency_row.authorization_id <> input_authorization_id
      or idempotency_row.request_hash <> input_request_hash then
      raise exception 'idempotency-conflict' using errcode = 'P0001';
    end if;

    return query select idempotency_row.comment_id, true, idempotency_row.response_body;
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
    or char_length(input_canonical_slug) > 200
    or input_canonical_slug !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$' then
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

  select * into thread_row
  from post_threads
  where canonical_slug = input_canonical_slug
  for update;

  if not found or not thread_row.comments_open then
    raise exception 'post-not-found' using errcode = 'P0001';
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

  result_body := jsonb_build_object('commentId', inserted_comment_id);
  insert into comment_idempotencies_v2 (
    idempotency_key, authorization_id, request_hash, comment_id, response_body, expires_at
  ) values (
    input_idempotency_key, input_authorization_id, input_request_hash, inserted_comment_id,
    result_body, greatest(authorization_row.expires_at, clock_timestamp() + interval '24 hours')
  );

  return query select inserted_comment_id, false, result_body;
end;
$$;

revoke all on function validate_quiz_question_options() from public, anon, authenticated;
revoke all on function issue_quiz_challenge(text, text, integer) from public, anon, authenticated;
revoke all on function verify_quiz_challenge_and_issue_authorization(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function issue_invite_comment_authorization(text, text, integer) from public, anon, authenticated;
revoke all on function create_comment_with_authorization(uuid, text, uuid, text, uuid, text, text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function issue_quiz_challenge(text, text, integer) to service_role;
grant execute on function verify_quiz_challenge_and_issue_authorization(uuid, uuid, text, integer) to service_role;
grant execute on function issue_invite_comment_authorization(text, text, integer) to service_role;
grant execute on function create_comment_with_authorization(uuid, text, uuid, text, uuid, text, text, text, text, integer, integer) to service_role;
