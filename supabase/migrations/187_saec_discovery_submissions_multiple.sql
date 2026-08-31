-- Allow multiple SAEC Discovery submissions per workspace.
-- Preserves all existing rows; drops the one-submission-per-workspace constraint.

alter table public.saec_discovery_submissions
  drop constraint if exists saec_discovery_submissions_workspace_unique;

create index if not exists saec_discovery_submissions_workspace_submitted_at_idx
  on public.saec_discovery_submissions (workspace_id, submitted_at desc);
