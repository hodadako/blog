create table if not exists post_view_events (
  id uuid primary key default gen_random_uuid(),
  post_thread_id uuid not null references post_threads(id) on delete cascade,
  client_ip text not null check (char_length(client_ip) between 1 and 64),
  country_code text null check (country_code is null or country_code ~ '^([A-Z]{2}|T1)$'),
  region text null check (region is null or char_length(region) between 1 and 120),
  city text null check (city is null or char_length(city) between 1 and 120),
  viewed_at timestamptz not null default now()
);

create index if not exists idx_post_view_events_thread_viewed
  on post_view_events(post_thread_id, viewed_at desc);

create index if not exists idx_post_view_events_client_ip_viewed
  on post_view_events(client_ip, viewed_at desc);

create index if not exists idx_post_view_events_country_viewed
  on post_view_events(country_code, viewed_at desc)
  where country_code is not null;

alter table post_view_events enable row level security;

revoke all on table post_view_events from public, anon, authenticated;
grant select, insert on table post_view_events to service_role;

create or replace function record_post_view(
  input_canonical_slug text,
  input_client_ip text,
  input_country_code text default null,
  input_region text default null,
  input_city text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_thread_id_value uuid;
  next_count integer;
  country_code_value text := upper(nullif(btrim(input_country_code), ''));
  region_value text := nullif(btrim(input_region), '');
  city_value text := nullif(btrim(input_city), '');
  client_ip_value text := nullif(btrim(input_client_ip), '');
begin
  if input_canonical_slug is null
    or char_length(input_canonical_slug) > 200
    or input_canonical_slug !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$'
    or client_ip_value is null
    or char_length(client_ip_value) > 64
    or (country_code_value is not null and country_code_value !~ '^([A-Z]{2}|T1)$')
    or (region_value is not null and char_length(region_value) > 120)
    or (city_value is not null and char_length(city_value) > 120) then
    raise exception 'invalid-post-view' using errcode = '22023';
  end if;

  select id into post_thread_id_value
  from post_threads
  where canonical_slug = input_canonical_slug
  for update;

  if not found then
    raise exception 'post-not-found' using errcode = 'P0001';
  end if;

  update post_threads
  set view_count = view_count + 1
  where id = post_thread_id_value
  returning view_count into next_count;

  insert into post_view_events (
    post_thread_id,
    client_ip,
    country_code,
    region,
    city
  ) values (
    post_thread_id_value,
    client_ip_value,
    country_code_value,
    region_value,
    city_value
  );

  return next_count;
end;
$$;

revoke all on function record_post_view(text, text, text, text, text) from public, anon, authenticated;
grant execute on function record_post_view(text, text, text, text, text) to service_role;
