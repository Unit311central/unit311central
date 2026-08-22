-- Phase 3 extension: customer login page configuration + initial workspace administrator tracking.

alter table public.workspace_admin_metadata
  add column if not exists login_page_title text;

alter table public.workspace_admin_metadata
  add column if not exists login_logo_storage_path text;

alter table public.workspace_admin_metadata
  add column if not exists login_background_storage_path text;

alter table public.workspace_admin_metadata
  add column if not exists provisioning_login_page_status text not null default 'not_started';

alter table public.workspace_admin_metadata
  add column if not exists provisioning_initial_admin_status text not null default 'not_started';

alter table public.workspace_admin_metadata
  add column if not exists initial_admin_email text;

alter table public.workspace_admin_metadata
  add column if not exists initial_admin_first_name text;

alter table public.workspace_admin_metadata
  add column if not exists initial_admin_last_name text;

alter table public.workspace_admin_metadata
  add column if not exists initial_admin_user_id uuid references public.platform_users (id) on delete set null;

comment on column public.workspace_admin_metadata.login_page_title is
  'Customer-facing login page title shown at {customer_hostname}.unit311central.com/login.';

comment on column public.workspace_admin_metadata.login_logo_storage_path is
  'Supabase storage path (internal-files bucket) for the workspace login logo asset.';

comment on column public.workspace_admin_metadata.login_background_storage_path is
  'Supabase storage path (internal-files bucket) for the workspace login background JPG.';

comment on column public.workspace_admin_metadata.initial_admin_user_id is
  'Platform user id for the mandatory initial Full Workspace Administrator (no password stored here).';

create index if not exists workspace_admin_metadata_initial_admin_user_id_idx
  on public.workspace_admin_metadata (initial_admin_user_id)
  where initial_admin_user_id is not null;
