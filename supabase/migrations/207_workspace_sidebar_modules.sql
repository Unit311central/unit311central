-- Per-workspace sidebar module visibility and order (central platform capability).
-- Disabling a module hides LHS navigation only — does not delete workspace data.

create table if not exists public.workspace_sidebar_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  module_id text not null,
  enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_sidebar_modules_workspace_module unique (workspace_id, module_id)
);

create index if not exists workspace_sidebar_modules_workspace_id_idx
  on public.workspace_sidebar_modules (workspace_id);

create index if not exists workspace_sidebar_modules_workspace_order_idx
  on public.workspace_sidebar_modules (workspace_id, display_order);

comment on table public.workspace_sidebar_modules is
  'Workspace LHS module visibility and ordering. module_id references the central product catalogue.';

alter table public.workspace_sidebar_modules enable row level security;

drop policy if exists workspace_sidebar_modules_deny_all on public.workspace_sidebar_modules;
create policy workspace_sidebar_modules_deny_all
  on public.workspace_sidebar_modules
  for all
  using (false);

-- Seed: all catalogue modules enabled for existing workspaces (preserve current visibility).
insert into public.workspace_sidebar_modules (workspace_id, module_id, enabled, display_order)
select
  w.id,
  seed.module_id,
  true,
  seed.display_order
from public.workspaces w
cross join (
  values
    ('intelligence', 300),
    ('business-central', 400),
    ('sales-management', 500),
    ('financials', 600),
    ('fundraising', 700),
    ('board', 800),
    ('corporate-information', 900),
    ('operations', 1000),
    ('marketing-events', 1100),
    ('technology-management', 1200),
    ('human-resources', 1300),
    ('business-productivity', 1400),
    ('support-desk', 1500),
    ('project-management', 1600),
    ('engineering', 1700),
    ('training', 1800),
    ('qms', 1900),
    ('tools', 2000),
    ('external-client-access', 2100)
) as seed(module_id, display_order)
where not exists (
  select 1
  from public.workspace_sidebar_modules existing
  where existing.workspace_id = w.id
);
