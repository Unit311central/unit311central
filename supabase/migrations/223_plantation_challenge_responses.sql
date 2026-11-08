-- Plantation challenge entries from the public /plantation form.
-- Public visitors submit only through the server API (service_role).
-- anon/authenticated have no privileges and a deny-all RLS policy.
-- One row per normalized participant name. Rows can be deleted by an
-- authenticated WOLF operator; they cannot be edited in place.

create or replace function public.plantation_challenge_responses_prepare()
returns trigger
language plpgsql
as $$
begin
  new.participant_name := btrim(new.participant_name);
  new.normalized_name := lower(new.participant_name);
  return new;
end;
$$;

create or replace function public.plantation_challenge_responses_block_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'plantation challenge submissions cannot be changed';
end;
$$;

create table if not exists public.plantation_challenge_responses (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  normalized_name text not null,
  section_1_hectares numeric(12, 4) not null,
  section_2_hectares numeric(12, 4) not null,
  section_1_trees integer not null,
  section_2_trees integer not null,
  submitted_at timestamptz not null default now(),
  constraint plantation_challenge_responses_normalized_name_key unique (normalized_name),
  constraint plantation_challenge_responses_name_not_blank check (btrim(participant_name) <> ''),
  constraint plantation_challenge_responses_normalized_matches check (
    normalized_name = lower(btrim(participant_name))
  ),
  constraint plantation_challenge_responses_section_1_hectares_range check (
    section_1_hectares >= 0 and section_1_hectares <= 100000
  ),
  constraint plantation_challenge_responses_section_2_hectares_range check (
    section_2_hectares >= 0 and section_2_hectares <= 100000
  ),
  constraint plantation_challenge_responses_section_1_trees_range check (
    section_1_trees >= 0 and section_1_trees <= 10000000
  ),
  constraint plantation_challenge_responses_section_2_trees_range check (
    section_2_trees >= 0 and section_2_trees <= 10000000
  )
);

create index if not exists plantation_challenge_responses_submitted_at_idx
  on public.plantation_challenge_responses (submitted_at desc);

drop trigger if exists plantation_challenge_responses_prepare
  on public.plantation_challenge_responses;
create trigger plantation_challenge_responses_prepare
  before insert on public.plantation_challenge_responses
  for each row execute function public.plantation_challenge_responses_prepare();

drop trigger if exists plantation_challenge_responses_block_update
  on public.plantation_challenge_responses;
create trigger plantation_challenge_responses_block_update
  before update on public.plantation_challenge_responses
  for each row execute function public.plantation_challenge_responses_block_update();

alter table public.plantation_challenge_responses enable row level security;
alter table public.plantation_challenge_responses force row level security;

drop policy if exists plantation_challenge_responses_deny_all
  on public.plantation_challenge_responses;
create policy plantation_challenge_responses_deny_all
  on public.plantation_challenge_responses
  for all
  using (false)
  with check (false);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.plantation_challenge_responses from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.plantation_challenge_responses from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, delete on table public.plantation_challenge_responses to service_role;
  end if;
end $$;

notify pgrst, 'reload schema';

comment on table public.plantation_challenge_responses is
  'Public plantation challenge guesses for the WOLF course. Inserts and deletes go through the server API using service_role. One row per normalized participant name.';
