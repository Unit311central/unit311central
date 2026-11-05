-- Malaysian Land Surveying Course pre-course questionnaire.
-- Kept separate from WOLF operational tables.
-- Public visitors submit only through the server API (service_role).
-- anon/authenticated have no privileges and a deny-all RLS policy.
-- normalized_name is the duplicate key. Inserts are atomic; updates are rejected
-- so an existing submission is never overwritten.

create or replace function public.malaysian_land_survey_course_responses_prepare()
returns trigger
language plpgsql
as $$
begin
  new.participant_name := btrim(new.participant_name);
  new.normalized_name := lower(new.participant_name);

  if new.question_1_answers is not null and cardinality(new.question_1_answers) = 0 then
    new.question_1_answers := null;
  end if;
  if new.question_2_answers is not null and cardinality(new.question_2_answers) = 0 then
    new.question_2_answers := null;
  end if;
  if new.question_3_answers is not null and cardinality(new.question_3_answers) = 0 then
    new.question_3_answers := null;
  end if;
  if new.question_4_answers is not null and cardinality(new.question_4_answers) = 0 then
    new.question_4_answers := null;
  end if;

  if new.question_5_comments is not null then
    new.question_5_comments := btrim(new.question_5_comments);
    if new.question_5_comments = '' then
      new.question_5_comments := null;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.malaysian_land_survey_course_responses_block_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'course questionnaire submissions cannot be changed';
end;
$$;

create table if not exists public.malaysian_land_survey_course_responses (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  normalized_name text not null,
  question_1_answers text[] null,
  question_2_answers text[] null,
  question_3_answers text[] null,
  question_4_answers text[] null,
  question_5_comments text null,
  submitted_at timestamptz not null default now(),
  constraint malaysian_land_survey_course_responses_normalized_name_key unique (normalized_name),
  constraint malaysian_land_survey_course_responses_name_not_blank check (btrim(participant_name) <> ''),
  constraint malaysian_land_survey_course_responses_normalized_matches check (
    normalized_name = lower(btrim(participant_name))
  ),
  constraint malaysian_land_survey_course_responses_comments_len check (
    question_5_comments is null or char_length(question_5_comments) <= 1000
  )
);

create index if not exists malaysian_land_survey_course_responses_submitted_at_idx
  on public.malaysian_land_survey_course_responses (submitted_at desc);

drop trigger if exists malaysian_land_survey_course_responses_prepare
  on public.malaysian_land_survey_course_responses;
create trigger malaysian_land_survey_course_responses_prepare
  before insert on public.malaysian_land_survey_course_responses
  for each row execute function public.malaysian_land_survey_course_responses_prepare();

drop trigger if exists malaysian_land_survey_course_responses_block_update
  on public.malaysian_land_survey_course_responses;
create trigger malaysian_land_survey_course_responses_block_update
  before update on public.malaysian_land_survey_course_responses
  for each row execute function public.malaysian_land_survey_course_responses_block_update();

alter table public.malaysian_land_survey_course_responses enable row level security;
alter table public.malaysian_land_survey_course_responses force row level security;

drop policy if exists malaysian_land_survey_course_responses_deny_all
  on public.malaysian_land_survey_course_responses;
create policy malaysian_land_survey_course_responses_deny_all
  on public.malaysian_land_survey_course_responses
  for all
  using (false)
  with check (false);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.malaysian_land_survey_course_responses from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.malaysian_land_survey_course_responses from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert on table public.malaysian_land_survey_course_responses to service_role;
  end if;
end $$;

notify pgrst, 'reload schema';

comment on table public.malaysian_land_survey_course_responses is
  'Pre-course questionnaire for the Malaysian land surveying course run with BCN Drone Center. Not WOLF operational data. Public inserts go through the server API using service_role. One row per normalized participant name; rows are immutable.';
