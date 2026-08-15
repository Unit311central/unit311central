-- Central Marketing & Events module (workspace-scoped).
-- Operational M&E data — not public website analytics (see website_marketing_events).

create table if not exists public.marketing_contacts (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null default '',
  email text not null default '',
  organisation text,
  segment text,
  status text not null default 'active',
  extension_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_contacts_workspace_idx
  on public.marketing_contacts (workspace_id, email);

create table if not exists public.marketing_newsletters (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  title text not null default '',
  subject text not null default '',
  html_body text not null default '',
  status text not null default 'draft',
  recipient_mode text not null default 'all',
  recipient_ids text[] not null default '{}',
  manual_emails text[] not null default '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  channels jsonb not null default '{"email": true}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  content_sources jsonb not null default '{}'::jsonb,
  extension_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_newsletters_workspace_idx
  on public.marketing_newsletters (workspace_id, status, updated_at desc);

create table if not exists public.marketing_campaigns (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  subject text not null default '',
  body text not null default '',
  status text not null default 'draft',
  recipient_mode text not null default 'all',
  recipient_ids text[] not null default '{}',
  manual_emails text[] not null default '{}',
  scheduled_at timestamptz,
  sent_at timestamptz,
  extension_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_campaigns_workspace_idx
  on public.marketing_campaigns (workspace_id, status, updated_at desc);

create table if not exists public.marketing_external_events (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null default '',
  start_date date not null,
  end_date date not null,
  city text not null default '',
  country text not null default '',
  website text,
  owner_label text,
  owner_id text,
  status text not null default 'Planning',
  notes text,
  member_ids text[] not null default '{}',
  calendar_synced boolean not null default false,
  extension_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_external_events_workspace_idx
  on public.marketing_external_events (workspace_id, start_date);

create table if not exists public.marketing_managed_events (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null default '',
  venue text not null default '',
  city text,
  event_date date not null,
  capacity integer not null default 0,
  registered integer not null default 0,
  budget_label text,
  stage text not null default 'Concept',
  owner_label text,
  status text not null default 'Planning',
  extension_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_managed_events_workspace_idx
  on public.marketing_managed_events (workspace_id, event_date);

create table if not exists public.marketing_media_assets (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null default '',
  media_type text not null default 'image',
  caption text,
  source_id text,
  source_label text,
  story_id text,
  journey_story_id text,
  url text,
  extension_data jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_media_assets_workspace_idx
  on public.marketing_media_assets (workspace_id, media_type);

create table if not exists public.marketing_stories (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  story_kind text not null default 'generic',
  title text not null default '',
  summary text not null default '',
  body text not null default '',
  status text not null default 'draft',
  extension_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_stories_workspace_idx
  on public.marketing_stories (workspace_id, story_kind, status);

-- ABHI specialist extension payloads (programmes, calendar, pavilion ops).
create table if not exists public.marketing_abhi_extensions (
  id text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  extension_kind text not null,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists marketing_abhi_extensions_workspace_kind_entity_idx
  on public.marketing_abhi_extensions (workspace_id, extension_kind, coalesce(entity_id, '__root__'));

alter table public.marketing_contacts enable row level security;
alter table public.marketing_newsletters enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_external_events enable row level security;
alter table public.marketing_managed_events enable row level security;
alter table public.marketing_media_assets enable row level security;
alter table public.marketing_stories enable row level security;
alter table public.marketing_abhi_extensions enable row level security;

-- Service-role / server routes enforce workspace scope; deny direct anon access.
create policy marketing_contacts_deny_all on public.marketing_contacts for all using (false);
create policy marketing_newsletters_deny_all on public.marketing_newsletters for all using (false);
create policy marketing_campaigns_deny_all on public.marketing_campaigns for all using (false);
create policy marketing_external_events_deny_all on public.marketing_external_events for all using (false);
create policy marketing_managed_events_deny_all on public.marketing_managed_events for all using (false);
create policy marketing_media_assets_deny_all on public.marketing_media_assets for all using (false);
create policy marketing_stories_deny_all on public.marketing_stories for all using (false);
create policy marketing_abhi_extensions_deny_all on public.marketing_abhi_extensions for all using (false);
