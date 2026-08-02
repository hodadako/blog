begin;

create extension if not exists pgtap;
select plan(14);

select ok(not has_table_privilege('anon', 'comments', 'insert'), 'anon cannot insert comments');
select ok(not has_table_privilege('anon', 'comments', 'update'), 'anon cannot update comments');
select ok(not has_table_privilege('anon', 'comments', 'delete'), 'anon cannot delete comments');
select ok(not has_table_privilege('anon', 'comment_authorizations', 'insert'), 'anon cannot issue authorizations');
select ok(not has_table_privilege('anon', 'invite_tokens', 'select'), 'anon cannot read invite hashes');
select ok(not has_table_privilege('anon', 'comment_quizzes', 'select'), 'anon cannot read quiz answer hashes');
select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comments_with_thread'
      and column_name in ('password_hash', 'ip_hash')
  ),
  'public comment view excludes sensitive hashes'
);

insert into comment_authorizations (
  id, purpose, canonical_slug, source, issued_at, expires_at
) values (
  '10000000-0000-4000-8000-000000000001',
  'COMMENT_WRITE',
  'authorization-test',
  'quiz',
  now(),
  now() + interval '5 minutes'
);

create temporary table first_result as
select * from create_authorized_comment(
  '10000000-0000-4000-8000-000000000001',
  'authorization-test',
  '20000000-0000-4000-8000-000000000001',
  'same-request-hash',
  null,
  'tester',
  'hello',
  'scrypt$0123456789abcdef$0123456789abcdef',
  'test-ip-hash'
);

select is((select replayed from first_result), false, 'first request creates a comment');
select ok(
  (select consumed_at is not null from comment_authorizations where id = '10000000-0000-4000-8000-000000000001'),
  'successful insert consumes authorization'
);
select is(
  (
    select comment_id
    from create_authorized_comment(
      '10000000-0000-4000-8000-000000000001',
      'authorization-test',
      '20000000-0000-4000-8000-000000000001',
      'same-request-hash',
      null,
      'tester',
      'hello',
      'scrypt$another-salt$another-hash-value',
      'test-ip-hash'
    )
  ),
  (select comment_id from first_result),
  'same idempotency key and body returns the original comment'
);
select throws_ok(
  $$
    select * from create_authorized_comment(
      '10000000-0000-4000-8000-000000000001',
      'authorization-test',
      '20000000-0000-4000-8000-000000000002',
      'same-request-hash',
      null,
      'tester',
      'hello',
      'scrypt$another-salt$another-hash-value',
      'test-ip-hash'
    )
  $$,
  'P0001',
  'authorization-invalid',
  'consumed authorization cannot create another comment'
);
select throws_ok(
  $$
    select * from create_authorized_comment(
      '10000000-0000-4000-8000-000000000001',
      'authorization-test',
      '20000000-0000-4000-8000-000000000001',
      'different-request-hash',
      null,
      'tester',
      'changed',
      'scrypt$another-salt$another-hash-value',
      'test-ip-hash'
    )
  $$,
  'P0001',
  'idempotency-conflict',
  'same idempotency key cannot be reused with a different body'
);

insert into comment_authorizations (
  id, purpose, canonical_slug, source, issued_at, expires_at
) values
  ('10000000-0000-4000-8000-000000000002', 'COMMENT_WRITE', 'authorization-test', 'quiz', now(), now() + interval '5 minutes'),
  ('10000000-0000-4000-8000-000000000003', 'COMMENT_WRITE', 'other-test', 'quiz', now(), now() + interval '5 minutes');

select throws_ok(
  $$
    select * from create_authorized_comment(
      '10000000-0000-4000-8000-000000000002',
      'authorization-test',
      '20000000-0000-4000-8000-000000000003',
      'duplicate-request-hash',
      null,
      'tester',
      'hello',
      'scrypt$another-salt$another-hash-value',
      'test-ip-hash'
    )
  $$,
  'P0001',
  'duplicate-comment',
  'same IP cannot post identical content repeatedly'
);

select throws_ok(
  format(
    $$
      select * from create_authorized_comment(
        '10000000-0000-4000-8000-000000000003',
        'other-test',
        '20000000-0000-4000-8000-000000000004',
        'cross-thread-request-hash',
        %L,
        'tester',
        'cross thread reply',
        'scrypt$another-salt$another-hash-value',
        'other-ip-hash'
      )
    $$,
    (select comment_id from first_result)
  ),
  'P0001',
  'invalid-parent-comment',
  'a parent comment from another canonical thread is rejected'
);

select * from finish();
rollback;
