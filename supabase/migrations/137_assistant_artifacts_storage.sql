-- Durable storage for executive-assistant PDF/PPTX artifacts (board packs, reports).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assistant-artifacts',
  'assistant-artifacts',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do nothing;

create table if not exists public.assistant_artifact_records (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  kind text not null check (kind in ('pdf', 'pptx', 'file')),
  created_at timestamptz not null default now()
);

create index if not exists assistant_artifact_records_user_id_idx
  on public.assistant_artifact_records (user_id, created_at desc);

alter table public.assistant_artifact_records enable row level security;
