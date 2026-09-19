begin;

create extension if not exists pgtap;
select plan(8);

select ok(not has_table_privilege('anon', 'post_view_events', 'select'), 'anon cannot read post view events');
select ok(not has_table_privilege('anon', 'post_view_events', 'insert'), 'anon cannot insert post view events');
select ok(
  not has_function_privilege('anon', 'record_post_view(text, text, text, text, text)', 'execute'),
  'anon cannot execute the post view recording function'
);

create temporary table view_baseline as
select view_count
from post_threads
where canonical_slug = '2025-retrospective';

select is(
  record_post_view('2025-retrospective', '203.0.113.10', 'KR', 'Seoul', 'Seoul'),
  (select view_count + 1 from view_baseline),
  'recording a view increments the post count'
);
select is(
  (select count(*) from post_view_events where client_ip = '203.0.113.10'),
  1::bigint,
  'recording a view creates one event'
);
select is(
  (select client_ip || ':' || country_code || ':' || region || ':' || city from post_view_events where client_ip = '203.0.113.10'),
  '203.0.113.10:KR:Seoul:Seoul',
  'event stores the IP and location metadata'
);
select throws_ok(
  $$select record_post_view('2025-retrospective', '')$$,
  '22023',
  'invalid-post-view',
  'missing client IPs are rejected'
);
select throws_ok(
  $$select record_post_view('missing-post', repeat('c', 64))$$,
  'P0001',
  'post-not-found',
  'unknown posts are rejected'
);

select * from finish();
rollback;
