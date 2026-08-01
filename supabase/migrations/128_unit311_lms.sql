-- Unit311 LMS foundation (multi-tenant via workspace_id).
-- Talanton is the first tenant to seed courses; ABHI/CorpCentre use the same tables.

create extension if not exists pgcrypto;

create table if not exists public.lms_courses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  code text not null,
  slug text not null,
  title text not null,
  description text not null default '',
  category text not null default 'Compliance',
  duration_minutes integer not null default 45,
  pass_mark integer not null default 80,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  certificate_prefix text not null default 'LMS',
  sort_order integer not null default 100,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug),
  unique (workspace_id, code)
);

create index if not exists lms_courses_workspace_status_idx
  on public.lms_courses (workspace_id, status, sort_order);

create table if not exists public.lms_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  title text not null,
  summary text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lms_modules_course_idx
  on public.lms_modules (workspace_id, course_id, sort_order);

create table if not exists public.lms_lessons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  module_id uuid not null references public.lms_modules (id) on delete cascade,
  title text not null,
  lesson_type text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  estimated_minutes integer not null default 5,
  created_at timestamptz not null default now()
);

create index if not exists lms_lessons_module_idx
  on public.lms_lessons (workspace_id, module_id, sort_order);

create index if not exists lms_lessons_course_idx
  on public.lms_lessons (workspace_id, course_id, sort_order);

create table if not exists public.lms_questions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  module_id uuid references public.lms_modules (id) on delete set null,
  question_type text not null default 'multiple_choice'
    check (question_type in ('multiple_choice', 'true_false', 'scenario')),
  stem text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_choice_id text not null,
  explanation text not null default '',
  difficulty text not null default 'medium',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lms_questions_course_idx
  on public.lms_questions (workspace_id, course_id, sort_order);

create table if not exists public.lms_assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  client_id text,
  user_id uuid,
  mandatory boolean not null default true,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lms_assignments_workspace_course_idx
  on public.lms_assignments (workspace_id, course_id);
create index if not exists lms_assignments_client_idx
  on public.lms_assignments (workspace_id, client_id);
create index if not exists lms_assignments_user_idx
  on public.lms_assignments (workspace_id, user_id);

create table if not exists public.lms_enrolments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  user_id uuid not null,
  client_id text,
  status text not null default 'assigned'
    check (status in ('assigned', 'in_progress', 'completed', 'failed')),
  progress_pct integer not null default 0,
  lesson_state jsonb not null default '{}'::jsonb,
  time_spent_seconds integer not null default 0,
  score integer,
  started_at timestamptz,
  completed_at timestamptz,
  last_lesson_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, course_id, user_id)
);

create index if not exists lms_enrolments_user_idx
  on public.lms_enrolments (workspace_id, user_id, status);
create index if not exists lms_enrolments_client_idx
  on public.lms_enrolments (workspace_id, client_id, status);

create table if not exists public.lms_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  enrolment_id uuid not null references public.lms_enrolments (id) on delete cascade,
  user_id uuid not null,
  question_ids jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  passed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lms_attempts_enrolment_idx
  on public.lms_attempts (workspace_id, enrolment_id, created_at desc);

create table if not exists public.lms_certificates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  course_id uuid not null references public.lms_courses (id) on delete cascade,
  enrolment_id uuid not null references public.lms_enrolments (id) on delete cascade,
  user_id uuid not null,
  client_id text,
  certificate_number text not null,
  verify_token text not null,
  learner_name text not null,
  company_name text not null default '',
  course_title text not null,
  score integer not null,
  issued_at timestamptz not null default now(),
  unique (workspace_id, certificate_number),
  unique (workspace_id, verify_token)
);

create index if not exists lms_certificates_user_idx
  on public.lms_certificates (workspace_id, user_id);
create index if not exists lms_certificates_course_idx
  on public.lms_certificates (workspace_id, course_id);

create table if not exists public.lms_certificate_sequences (
  workspace_id uuid not null,
  course_code text not null,
  year integer not null,
  last_value integer not null default 0,
  primary key (workspace_id, course_code, year)
);

alter table public.lms_courses enable row level security;
alter table public.lms_modules enable row level security;
alter table public.lms_lessons enable row level security;
alter table public.lms_questions enable row level security;
alter table public.lms_assignments enable row level security;
alter table public.lms_enrolments enable row level security;
alter table public.lms_attempts enable row level security;
alter table public.lms_certificates enable row level security;
alter table public.lms_certificate_sequences enable row level security;

-- Service role bypasses RLS; permissive policies for anon are intentionally absent.
drop policy if exists "lms_courses_service" on public.lms_courses;
drop policy if exists "lms_modules_service" on public.lms_modules;
drop policy if exists "lms_lessons_service" on public.lms_lessons;
drop policy if exists "lms_questions_service" on public.lms_questions;
drop policy if exists "lms_assignments_service" on public.lms_assignments;
drop policy if exists "lms_enrolments_service" on public.lms_enrolments;
drop policy if exists "lms_attempts_service" on public.lms_attempts;
drop policy if exists "lms_certificates_service" on public.lms_certificates;
