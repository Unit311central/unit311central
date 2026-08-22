-- Phase 3 workspace provisioning: customer hostname override + host alias registry.

alter table public.workspace_admin_metadata
  add column if not exists customer_hostname text;

alter table public.workspace_admin_metadata
  add column if not exists provisioning_overall_status text not null default 'not_started';

comment on column public.workspace_admin_metadata.customer_hostname is
  'Customer-facing subdomain label — may differ from workspaces.slug when compact hostnames are used.';

comment on column public.workspace_admin_metadata.provisioning_overall_status is
  'Aggregate Phase 3 provisioning state: not_started | in_progress | complete | failed.';

create table if not exists public.workspace_host_aliases (
  alias_subdomain text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  workspace_slug text not null,
  created_at timestamptz not null default now(),
  constraint workspace_host_aliases_subdomain_format
    check (alias_subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$')
);

create index if not exists workspace_host_aliases_workspace_id_idx
  on public.workspace_host_aliases (workspace_id);

comment on table public.workspace_host_aliases is
  'Maps customer-facing host subdomains to canonical workspace slugs when they differ.';

alter table public.workspace_host_aliases enable row level security;

drop policy if exists workspace_host_aliases_deny_all on public.workspace_host_aliases;
create policy workspace_host_aliases_deny_all
  on public.workspace_host_aliases
  for all
  using (false);
