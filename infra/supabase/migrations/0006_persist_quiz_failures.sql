drop function if exists verify_quiz_challenge_and_issue_authorization(uuid, uuid, text, integer);

create or replace function verify_quiz_challenge_and_issue_authorization(
  input_challenge_id uuid,
  input_selected_option_id uuid,
  input_requester_ip_hash text,
  input_ttl_seconds integer default 300
)
returns table (authorization_id uuid, canonical_slug text, expires_at timestamptz, outcome text)
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
    update quiz_challenges
    set status = case when status = 'PENDING' then 'EXPIRED' else status end
    where id = challenge_row.id;
    return query select null::uuid, challenge_row.canonical_slug, null::timestamptz, 'EXPIRED';
    return;
  end if;

  update quiz_challenges
  set attempt_count = 1
  where id = challenge_row.id;

  if not (input_selected_option_id = any(challenge_row.allowed_option_ids))
    or input_selected_option_id <> challenge_row.correct_option_id then
    update quiz_challenges set status = 'FAILED' where id = challenge_row.id;
    return query select null::uuid, challenge_row.canonical_slug, null::timestamptz, 'INCORRECT';
    return;
  end if;

  authorization_expires := clock_timestamp() + least(greatest(coalesce(input_ttl_seconds, 300), 60), 900) * interval '1 second';
  update quiz_challenges
  set status = 'VERIFIED', verified_at = clock_timestamp()
  where id = challenge_row.id and status = 'PENDING';

  if not found then
    return query select null::uuid, challenge_row.canonical_slug, null::timestamptz, 'EXPIRED';
    return;
  end if;

  insert into comment_authorizations (
    id, purpose, canonical_slug, source, issued_at, expires_at
  ) values (
    gen_random_uuid(), 'COMMENT_WRITE', challenge_row.canonical_slug, 'quiz', clock_timestamp(), authorization_expires
  ) returning id into authorization_id_value;

  return query select authorization_id_value, challenge_row.canonical_slug, authorization_expires, 'AUTHORIZED';
end;
$$;

revoke all on function verify_quiz_challenge_and_issue_authorization(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function verify_quiz_challenge_and_issue_authorization(uuid, uuid, text, integer) to service_role;
