begin;

create extension if not exists pgtap;
select plan(16);

select ok(not has_table_privilege('anon', 'quiz_categories', 'select'), 'anon cannot read quiz categories directly');
select ok(not has_table_privilege('anon', 'quiz_questions', 'select'), 'anon cannot read quiz questions directly');
select ok(not has_table_privilege('anon', 'quiz_options', 'select'), 'anon cannot read quiz options or answers directly');
select ok(not has_table_privilege('anon', 'quiz_challenges', 'insert'), 'anon cannot create challenges directly');
select ok(not has_table_privilege('anon', 'comment_idempotencies_v2', 'insert'), 'anon cannot create idempotency rows directly');
select is((select count(*) from quiz_categories where active), 6::bigint, 'seed contains six active categories');
select is((select count(*) from quiz_options where question_id in (select id from quiz_questions where active)), 20::bigint, 'active seed questions contain twenty options');
select is((select min(option_count) from (select count(*) option_count from quiz_options join quiz_questions on quiz_questions.id = quiz_options.question_id where quiz_questions.active group by quiz_questions.id) counts), 5::bigint, 'active questions have five options');
select is((select max(correct_count) from (select count(*) filter (where is_correct) correct_count from quiz_options join quiz_questions on quiz_questions.id = quiz_options.question_id where quiz_questions.active group by quiz_questions.id) counts), 1::bigint, 'active questions have one correct option');

create temporary table issued_challenge as
select issue_quiz_challenge('2025-retrospective', repeat('a', 64), 300) as payload;

select is(jsonb_array_length((select payload->'options' from issued_challenge)), 5, 'challenge response has five options');
select ok(not ((select payload from issued_challenge) ? 'correctOptionId'), 'challenge response omits correct option');
select ok(not ((select payload from issued_challenge) ? 'answer'), 'challenge response omits answer');

select is(
  (select outcome from verify_quiz_challenge_and_issue_authorization(
    (select (payload->>'challengeId')::uuid from issued_challenge),
    '00000000-0000-4000-8000-000000000000',
    repeat('a', 64),
    300
  )),
  'INCORRECT',
  'wrong or disallowed option marks the challenge failed'
);

create temporary table authorized_challenge as
select issue_quiz_challenge('2025-retrospective', repeat('a', 64), 300) as payload;

create temporary table verified_authorization as
select * from verify_quiz_challenge_and_issue_authorization(
  (select (payload->>'challengeId')::uuid from authorized_challenge),
  (select correct_option_id from quiz_challenges where id = (select (payload->>'challengeId')::uuid from authorized_challenge)),
  repeat('a', 64),
  300
);

select ok((select authorization_id is not null from verified_authorization), 'correct answer issues an authorization');
select is((select source from comment_authorizations where id = (select authorization_id from verified_authorization)), 'quiz', 'authorization records quiz source');
select is(
  (select outcome from verify_quiz_challenge_and_issue_authorization(
    (select (payload->>'challengeId')::uuid from authorized_challenge),
    (select correct_option_id from quiz_challenges where id = (select (payload->>'challengeId')::uuid from authorized_challenge)),
    repeat('a', 64),
    300
  )),
  'EXPIRED',
  'verified challenge cannot be reused'
);

select * from finish();
rollback;
