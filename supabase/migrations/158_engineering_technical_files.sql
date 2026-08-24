-- Engineering Technical Files — workspace-scoped technical document repository with versioning.

create table if not exists public.engineering_masters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  description text not null default '',
  program_ref text,
  product_ref text,
  status text not null default 'Active'
    check (status in ('Active', 'On Hold', 'Completed', 'Archived')),
  created_by_user_id uuid references public.platform_users (id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists engineering_masters_workspace_idx
  on public.engineering_masters (workspace_id, updated_at desc);

create table if not exists public.engineering_technical_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'Other'
    check (category in (
      'CAD', '3D Model', 'Drawing', 'Specification', 'Design Document',
      'Test / Validation', 'Manufacturing', 'Regulatory', 'Supplier',
      'Reference', 'Image', 'Other'
    )),
  file_kind text not null default 'document',
  status text not null default 'Draft'
    check (status in ('Draft', 'In Review', 'Approved', 'Released', 'Superseded', 'Archived')),
  master_id uuid references public.engineering_masters (id) on delete set null,
  program_ref text,
  product_ref text,
  part_number text,
  drawing_number text,
  tags text[] not null default '{}',
  notes text not null default '',
  access_level text not null default 'standard'
    check (access_level in ('standard', 'confidential', 'restricted')),
  current_version_id uuid,
  archived_at timestamptz,
  created_by_user_id uuid references public.platform_users (id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists engineering_technical_files_workspace_idx
  on public.engineering_technical_files (workspace_id, updated_at desc)
  where archived_at is null;

create index if not exists engineering_technical_files_master_idx
  on public.engineering_technical_files (workspace_id, master_id);

create table if not exists public.engineering_technical_file_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  technical_file_id uuid not null references public.engineering_technical_files (id) on delete cascade,
  revision text not null,
  version_label text not null default '',
  file_name text not null,
  storage_path text not null,
  mime_type text,
  extension text,
  size_bytes bigint not null default 0,
  checksum text,
  is_current boolean not null default false,
  uploaded_by_user_id uuid references public.platform_users (id) on delete set null,
  uploaded_by_name text not null default '',
  change_notes text not null default '',
  created_at timestamptz not null default now(),
  unique (technical_file_id, revision)
);

create index if not exists engineering_technical_file_versions_file_idx
  on public.engineering_technical_file_versions (technical_file_id, created_at desc);

create unique index if not exists engineering_technical_file_versions_one_current_idx
  on public.engineering_technical_file_versions (technical_file_id)
  where is_current = true;

alter table public.engineering_technical_files
  drop constraint if exists engineering_technical_files_current_version_fk;

alter table public.engineering_technical_files
  add constraint engineering_technical_files_current_version_fk
  foreign key (current_version_id)
  references public.engineering_technical_file_versions (id)
  on delete set null;

create table if not exists public.engineering_technical_file_relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  source_file_id uuid not null references public.engineering_technical_files (id) on delete cascade,
  target_type text not null
    check (target_type in (
      'technical_file', 'master', 'sop', 'program', 'milestone',
      'product', 'project', 'risk', 'task'
    )),
  target_id text not null,
  label text,
  created_at timestamptz not null default now(),
  unique (source_file_id, target_type, target_id)
);

create index if not exists engineering_technical_file_rel_workspace_idx
  on public.engineering_technical_file_relationships (workspace_id, source_file_id);

create table if not exists public.engineering_technical_file_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  technical_file_id uuid references public.engineering_technical_files (id) on delete set null,
  version_id uuid references public.engineering_technical_file_versions (id) on delete set null,
  event_type text not null,
  actor_name text not null,
  actor_user_id uuid references public.platform_users (id) on delete set null,
  comment text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists engineering_technical_file_events_workspace_idx
  on public.engineering_technical_file_events (workspace_id, created_at desc);

alter table public.engineering_masters enable row level security;
alter table public.engineering_technical_files enable row level security;
alter table public.engineering_technical_file_versions enable row level security;
alter table public.engineering_technical_file_relationships enable row level security;
alter table public.engineering_technical_file_events enable row level security;

drop policy if exists "engineering_masters_all" on public.engineering_masters;
create policy "engineering_masters_all" on public.engineering_masters for all using (true) with check (true);

drop policy if exists "engineering_technical_files_all" on public.engineering_technical_files;
create policy "engineering_technical_files_all" on public.engineering_technical_files for all using (true) with check (true);

drop policy if exists "engineering_technical_file_versions_all" on public.engineering_technical_file_versions;
create policy "engineering_technical_file_versions_all" on public.engineering_technical_file_versions for all using (true) with check (true);

drop policy if exists "engineering_technical_file_relationships_all" on public.engineering_technical_file_relationships;
create policy "engineering_technical_file_relationships_all" on public.engineering_technical_file_relationships for all using (true) with check (true);

drop policy if exists "engineering_technical_file_events_all" on public.engineering_technical_file_events;
create policy "engineering_technical_file_events_all" on public.engineering_technical_file_events for all using (true) with check (true);
