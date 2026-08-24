-- Multi legal entity / company records per workspace (Corporate Information → Company Information).
-- Preserves existing rows; drops one-company-per-workspace constraint.

alter table public.company_details
  drop constraint if exists company_details_workspace_id_key;

alter table public.company_details
  add column if not exists archived_at timestamptz null,
  add column if not exists display_order integer not null default 0;

create index if not exists company_details_workspace_active_idx
  on public.company_details (workspace_id, display_order, created_at)
  where archived_at is null;

create index if not exists company_details_workspace_id_id_idx
  on public.company_details (workspace_id, id);
