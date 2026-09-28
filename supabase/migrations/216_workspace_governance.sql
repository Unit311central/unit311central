-- Workspace-scoped board governance (Talanton Impact and other tenants via API auth).
-- Access: service role + requireCurrentWorkspace() on API routes (same pattern as portfolio_companies).

create extension if not exists pgcrypto;

create table if not exists public.workspace_governance_meetings (
  id text not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  meeting_date date not null,
  meeting_type text not null,
  title text not null,
  status text not null,
  attendees jsonb not null default '[]'::jsonb,
  minutes text not null default '',
  decisions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create index if not exists workspace_governance_meetings_ws_date_idx
  on public.workspace_governance_meetings (workspace_id, meeting_date desc);

create table if not exists public.workspace_governance_risks (
  id text not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  description text not null,
  owner text not null default 'Unassigned',
  impact text not null default 'M',
  likelihood text not null default 'M',
  rating integer not null default 9,
  mitigation text not null default '',
  status text not null default 'Open',
  date_added date not null,
  review_date date not null,
  board_pack_id text not null default '',
  board_pack_label text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create index if not exists workspace_governance_risks_ws_date_idx
  on public.workspace_governance_risks (workspace_id, date_added desc);

create table if not exists public.workspace_board_members (
  id text not null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  display_name text not null,
  role text not null,
  email text not null,
  committees jsonb not null default '[]'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);

create index if not exists workspace_board_members_ws_sort_idx
  on public.workspace_board_members (workspace_id, sort_order, display_name);

create table if not exists public.workspace_governance_import_log (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  import_key text not null,
  imported_at timestamptz not null default now(),
  primary key (workspace_id, import_key)
);

alter table public.workspace_governance_meetings enable row level security;
alter table public.workspace_governance_risks enable row level security;
alter table public.workspace_board_members enable row level security;
alter table public.workspace_governance_import_log enable row level security;

drop policy if exists "workspace_governance_meetings_service" on public.workspace_governance_meetings;
create policy "workspace_governance_meetings_service"
  on public.workspace_governance_meetings
  for all
  using (true)
  with check (true);

drop policy if exists "workspace_governance_risks_service" on public.workspace_governance_risks;
create policy "workspace_governance_risks_service"
  on public.workspace_governance_risks
  for all
  using (true)
  with check (true);

drop policy if exists "workspace_board_members_service" on public.workspace_board_members;
create policy "workspace_board_members_service"
  on public.workspace_board_members
  for all
  using (true)
  with check (true);

drop policy if exists "workspace_governance_import_log_service" on public.workspace_governance_import_log;
create policy "workspace_governance_import_log_service"
  on public.workspace_governance_import_log
  for all
  using (true)
  with check (true);
