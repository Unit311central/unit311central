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

-- Seed from legacy workspace_admin_metadata.enabled_modules when present.
-- When metadata is empty or pins-only, enable all configurable modules (specialist full nav).
-- Idempotent: skips workspaces that already have sidebar rows.
with configurable_modules as (
  select *
  from (
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
      ('external-client-access', 2100),
      ('wolf-animals', 2200),
      ('wolf-containment', 2300),
      ('wolf-environment', 2400),
      ('wolf-drone-operations', 2500),
      ('wolf-fleet', 2600)
  ) as m(module_id, default_order)
),
workspaces_needing_seed as (
  select w.id as workspace_id, m.enabled_modules
  from public.workspaces w
  left join public.workspace_admin_metadata m on m.workspace_id = w.id
  where not exists (
    select 1
    from public.workspace_sidebar_modules existing
    where existing.workspace_id = w.id
  )
),
parsed as (
  select
    wns.workspace_id,
    wns.enabled_modules,
    coalesce(jsonb_array_length(wns.enabled_modules), 0) > 0
      and exists (
        select 1
        from jsonb_array_elements_text(wns.enabled_modules) as elem(value)
        where elem.value not in ('home', 'executive-assistant', 'settings')
      ) as has_metadata_selection
  from workspaces_needing_seed wns
)
insert into public.workspace_sidebar_modules (workspace_id, module_id, enabled, display_order)
select
  p.workspace_id,
  cm.module_id,
  case
    when not p.has_metadata_selection then true
    else exists (
      select 1
      from jsonb_array_elements_text(p.enabled_modules) as elem(value)
      where elem.value = cm.module_id
    )
  end as enabled,
  case
    when not p.has_metadata_selection then cm.default_order
    when exists (
      select 1
      from jsonb_array_elements_text(p.enabled_modules) as elem(value)
      where elem.value = cm.module_id
    )
    then coalesce(
      (
        select t.idx
        from jsonb_array_elements_text(p.enabled_modules)
          with ordinality as t(value, idx)
        where t.value = cm.module_id
        limit 1
      ),
      cm.default_order
    ) * 10
    else cm.default_order + 50000
  end as display_order
from parsed p
cross join configurable_modules cm;
