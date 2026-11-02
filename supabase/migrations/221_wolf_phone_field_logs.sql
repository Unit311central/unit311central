-- WOLF phone field logs — geotagged marks, photos, and short videos from Phone Link.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wolf-phone-capture',
  'wolf-phone-capture',
  false,
  83886080,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/webm',
    'video/mp4'
  ]::text[]
)
on conflict (id) do nothing;

create table if not exists public.wolf_phone_field_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  kind text not null check (kind in ('position', 'photo', 'video')),
  captured_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  altitude double precision,
  speed double precision,
  heading double precision,
  storage_bucket text,
  storage_object_path text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists wolf_phone_field_logs_workspace_captured_idx
  on public.wolf_phone_field_logs (workspace_id, captured_at desc);

alter table public.wolf_phone_field_logs enable row level security;

drop policy if exists wolf_phone_field_logs_deny_all on public.wolf_phone_field_logs;
create policy wolf_phone_field_logs_deny_all
  on public.wolf_phone_field_logs
  for all
  using (false);

drop policy if exists wolf_phone_capture_deny_anon_authenticated on storage.objects;
create policy wolf_phone_capture_deny_anon_authenticated
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'wolf-phone-capture' and false)
  with check (bucket_id = 'wolf-phone-capture' and false);

comment on table public.wolf_phone_field_logs is
  'Geotagged phone marks, photos, and videos from WOLF Phone Link. Service-role API only.';
