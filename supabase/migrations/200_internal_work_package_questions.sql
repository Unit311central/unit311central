-- Work package questionnaire rows + answer audit log (Internal Work Packages).

create table if not exists internal_work_package_questions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  work_package_id uuid not null references internal_work_packages(id) on delete cascade,
  category text not null default '',
  question_text text not null,
  sort_order integer not null default 0,
  current_answer text not null default '',
  answered_at timestamptz,
  answered_by_user_id uuid,
  answered_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_work_package_questions_pkg_idx
  on internal_work_package_questions (work_package_id, sort_order);

create table if not exists internal_work_package_question_answer_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  work_package_id uuid not null references internal_work_packages(id) on delete cascade,
  question_id uuid not null references internal_work_package_questions(id) on delete cascade,
  answer_text text not null,
  answered_at timestamptz not null default now(),
  answered_by_user_id uuid,
  answered_by_name text not null default ''
);

create index if not exists internal_work_package_question_answer_log_q_idx
  on internal_work_package_question_answer_log (question_id, answered_at desc);

alter table public.internal_work_package_questions enable row level security;
alter table public.internal_work_package_question_answer_log enable row level security;

drop policy if exists "internal_work_package_questions_all" on public.internal_work_package_questions;
create policy "internal_work_package_questions_all" on public.internal_work_package_questions for all using (true) with check (true);

drop policy if exists "internal_work_package_question_answer_log_all" on public.internal_work_package_question_answer_log;
create policy "internal_work_package_question_answer_log_all" on public.internal_work_package_question_answer_log for all using (true) with check (true);

-- Seed WP2 – Questions for BCN in wolf-central (idempotent).
do $$
declare
  v_wolf_id uuid;
  v_pkg_id uuid;
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '200_internal_work_package_questions: wolf-central missing — skipped seed';
    return;
  end if;

  select id into v_pkg_id
  from public.internal_work_packages
  where workspace_id = v_wolf_id and package_code = 'WP2'
  limit 1;

  if v_pkg_id is null then
    insert into public.internal_work_packages (
      workspace_id,
      package_code,
      name,
      description,
      status,
      priority,
      owner_name,
      created_by_name,
      notes
    ) values (
      v_wolf_id,
      'WP2',
      'WP2 – Questions for BCN',
      'Structured questionnaire for BCN video handling, streaming, and ground-control integration.',
      'In Progress',
      'High',
      'WOLF Central',
      'System',
      'questionnaire'
    )
    returning id into v_pkg_id;
  end if;

  if not exists (
    select 1 from public.internal_work_package_questions
    where work_package_id = v_pkg_id
    limit 1
  ) then
    insert into public.internal_work_package_questions (
      workspace_id, work_package_id, category, question_text, sort_order
    ) values
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Does BCN Base decode compressed video?', 1),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Does the station pass the compressed video stream through without decoding it?', 2),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Does station re-encode video into another codec, bitrate or stream format?', 3),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Does base make video available as an IP/Network video stream on the BCN Ethernet network?', 4),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Other?', 5),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Can WOLF obtain a simultaneous low-latency copy of the video received by the BCN Base station without interfering with the BCN control system?', 6),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'What protocol does the BCN base station use to make the video available to BCN Laptops?', 7),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Can your Windows ground-control software provide the live video received from the base station to a third-party application or network destination simultaneously with displaying it to the operator? If so, how?', 8),
      (v_wolf_id, v_pkg_id, 'VIDEO HANDLING', 'Frame rate / quality?', 9);
  end if;

  raise notice '200_internal_work_package_questions: ensured WP2 questionnaire for wolf-central';
end $$;
