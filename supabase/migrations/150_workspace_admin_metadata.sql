-- Workspace administration metadata for Internal Central Workspaces module (Phase 2).
-- Canonical workspace identity remains public.workspaces + foundation tables.
-- This table stores wizard/admin-only metadata not owned elsewhere.

create table if not exists public.workspace_admin_metadata (
  workspace_id uuid primary key references public.workspaces (id) on delete restrict,
  company_name text not null default '',
  contact_name text not null default '',
  contact_email text not null default '',
  country text not null default '',
  description text not null default '',
  branding_display_name text not null default '',
  enabled_modules jsonb not null default '[]'::jsonb,
  enabled_sub_modules jsonb not null default '[]'::jsonb,
  pending_employees jsonb not null default '[]'::jsonb,
  pending_clients jsonb not null default '[]'::jsonb,
  created_by text not null default 'system',
  provisioning_database_status text not null default 'not_started',
  provisioning_authentication_status text not null default 'not_started',
  provisioning_infrastructure_status text not null default 'not_started',
  provisioning_deployment_status text not null default 'not_started',
  provisioning_workspace_record_status text not null default 'not_started',
  provisioning_last_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_admin_metadata_enabled_modules_array
    check (jsonb_typeof(enabled_modules) = 'array'),
  constraint workspace_admin_metadata_enabled_sub_modules_array
    check (jsonb_typeof(enabled_sub_modules) = 'array'),
  constraint workspace_admin_metadata_pending_employees_array
    check (jsonb_typeof(pending_employees) = 'array'),
  constraint workspace_admin_metadata_pending_clients_array
    check (jsonb_typeof(pending_clients) = 'array')
);

create index if not exists workspace_admin_metadata_created_at_idx
  on public.workspace_admin_metadata (created_at desc);

comment on table public.workspace_admin_metadata is
  'Internal Workspaces administration metadata (wizard selections, imports, provisioning state). '
  'Identity and runtime module toggles remain on workspaces / workspace_settings / workspace_modules.';

-- RLS: deny-all (service_role server access only — matches foundation tables).
alter table public.workspace_admin_metadata enable row level security;

drop policy if exists workspace_admin_metadata_deny_all on public.workspace_admin_metadata;
create policy workspace_admin_metadata_deny_all
  on public.workspace_admin_metadata
  for all
  using (false);

-- Seed admin metadata for canonical platform workspaces when missing.
insert into public.workspace_admin_metadata (
  workspace_id,
  company_name,
  contact_name,
  contact_email,
  country,
  description,
  branding_display_name,
  enabled_modules,
  enabled_sub_modules,
  created_by,
  provisioning_database_status,
  provisioning_authentication_status,
  provisioning_infrastructure_status,
  provisioning_deployment_status,
  provisioning_workspace_record_status,
  provisioning_last_message
)
select
  w.id,
  case w.slug
    when 'unit311' then 'Unit311 Central Ltd'
    when 'demo' then 'Northstar Demo Corp'
    else w.name
  end,
  case w.slug
    when 'unit311' then 'Platform Operations'
    when 'demo' then 'Demo Owner'
    else ''
  end,
  case w.slug
    when 'unit311' then 'ops@unit311central.com'
    when 'demo' then 'demo@unit311central.com'
    else ''
  end,
  'United Kingdom',
  case w.slug
    when 'unit311' then 'Internal Central operations workspace.'
    when 'demo' then 'Permanent demo workspace for sales and training.'
    else ''
  end,
  case w.slug
    when 'unit311' then 'Unit311 Central'
    when 'demo' then 'Northstar Demo'
    else w.name
  end,
  case w.slug
    when 'unit311' then '["home","executive-assistant","business-central","financials","settings"]'::jsonb
    when 'demo' then '["home","executive-assistant","business-central","financials","board"]'::jsonb
    else '[]'::jsonb
  end,
  '[]'::jsonb,
  'system',
  'complete',
  'complete',
  'complete',
  'complete',
  'complete',
  case w.slug
    when 'unit311' then 'Live internal workspace.'
    when 'demo' then 'Demo workspace is live.'
    else 'Workspace registry record.'
  end
from public.workspaces w
where w.slug in ('unit311', 'demo')
  and not exists (
    select 1
    from public.workspace_admin_metadata m
    where m.workspace_id = w.id
  );
