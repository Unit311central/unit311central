-- Phase 1 (step 5): Storage workspace isolation for internal-files and assistant-artifacts.
-- Target path layout: {workspace_id}/... (new uploads). Legacy paths without a UUID prefix remain
-- readable via service role only (server signed-URL flows).
--
-- Anon/authenticated direct bucket access is denied. Server must use service_role for storage ops.

-- ---------------------------------------------------------------------------
-- internal-files
-- ---------------------------------------------------------------------------
drop policy if exists "internal_files_storage_select" on storage.objects;
drop policy if exists "internal_files_storage_insert" on storage.objects;
drop policy if exists "internal_files_storage_update" on storage.objects;
drop policy if exists "internal_files_storage_delete" on storage.objects;

drop policy if exists internal_files_deny_anon_authenticated on storage.objects;
create policy internal_files_deny_anon_authenticated
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'internal-files' and false)
  with check (bucket_id = 'internal-files' and false);

-- ---------------------------------------------------------------------------
-- assistant-artifacts (EA persistence — already service-role only in app)
-- ---------------------------------------------------------------------------
drop policy if exists assistant_artifacts_deny_anon_authenticated on storage.objects;
create policy assistant_artifacts_deny_anon_authenticated
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'assistant-artifacts' and false)
  with check (bucket_id = 'assistant-artifacts' and false);

-- ---------------------------------------------------------------------------
-- assistant_artifact_records metadata table
-- ---------------------------------------------------------------------------
alter table public.assistant_artifact_records enable row level security;

drop policy if exists assistant_artifact_records_deny_all on public.assistant_artifact_records;
create policy assistant_artifact_records_deny_all
  on public.assistant_artifact_records
  for all
  using (false);

-- ---------------------------------------------------------------------------
-- Optional workspace_uuid on artifact paths (additive; app may adopt gradually)
-- ---------------------------------------------------------------------------
alter table public.assistant_artifact_records
  add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;

create index if not exists assistant_artifact_records_workspace_id_idx
  on public.assistant_artifact_records (workspace_id)
  where workspace_id is not null;
