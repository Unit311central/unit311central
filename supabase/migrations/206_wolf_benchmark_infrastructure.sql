-- WOLF AI benchmark infrastructure — private storage bucket and internal catalog/run tables.
-- Not workspace-scoped: platform-internal regression harness (service_role / agent-side only).
-- Object layout:
--   videos/animals.mp4
--   videos/kenya/kenya_01.mp4 …
--   evidence/runs/{run_id}/…
--   results/runs/{run_id}/summary.json

-- ---------------------------------------------------------------------------
-- Storage bucket (private; no anonymous or browser client access)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wolf-benchmark',
  'wolf-benchmark',
  false,
  5368709120,
  array[
    'video/mp4',
    'image/jpeg',
    'application/json'
  ]::text[]
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- wolf_benchmark_videos — catalog metadata for benchmark input videos
-- ---------------------------------------------------------------------------
create table if not exists public.wolf_benchmark_videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  display_name text not null,
  source_dataset text,
  source_url text,
  storage_bucket text not null,
  storage_object_path text not null,
  licence text,
  width integer,
  height integer,
  fps numeric,
  duration_seconds numeric,
  checksum_sha256 text,
  known_species jsonb,
  approval_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wolf_benchmark_videos_slug_unique unique (slug)
);

create index if not exists wolf_benchmark_videos_storage_path_idx
  on public.wolf_benchmark_videos (storage_bucket, storage_object_path);

create index if not exists wolf_benchmark_videos_created_at_idx
  on public.wolf_benchmark_videos (created_at desc);

-- ---------------------------------------------------------------------------
-- wolf_benchmark_runs — one row per model benchmark execution
-- ---------------------------------------------------------------------------
create table if not exists public.wolf_benchmark_runs (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.wolf_benchmark_videos (id) on delete restrict,
  model_name text,
  model_version text,
  model_checkpoint text,
  model_licence text,
  run_config jsonb,
  status text,
  frames_processed integer,
  detection_count integer,
  classification_count integer,
  confidence_stats jsonb,
  processing_seconds numeric,
  inference_seconds numeric,
  evidence_paths jsonb,
  result_summary jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wolf_benchmark_runs_video_id_idx
  on public.wolf_benchmark_runs (video_id);

create index if not exists wolf_benchmark_runs_status_idx
  on public.wolf_benchmark_runs (status);

create index if not exists wolf_benchmark_runs_created_at_idx
  on public.wolf_benchmark_runs (created_at desc);

create index if not exists wolf_benchmark_runs_video_created_at_idx
  on public.wolf_benchmark_runs (video_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security (deny-by-default — service_role server access only)
-- ---------------------------------------------------------------------------
alter table public.wolf_benchmark_videos enable row level security;
alter table public.wolf_benchmark_runs enable row level security;

drop policy if exists wolf_benchmark_videos_deny_all on public.wolf_benchmark_videos;
create policy wolf_benchmark_videos_deny_all
  on public.wolf_benchmark_videos
  for all
  using (false);

drop policy if exists wolf_benchmark_runs_deny_all on public.wolf_benchmark_runs;
create policy wolf_benchmark_runs_deny_all
  on public.wolf_benchmark_runs
  for all
  using (false);

-- ---------------------------------------------------------------------------
-- Storage isolation (anon/authenticated direct bucket access denied)
-- ---------------------------------------------------------------------------
drop policy if exists wolf_benchmark_deny_anon_authenticated on storage.objects;
create policy wolf_benchmark_deny_anon_authenticated
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'wolf-benchmark' and false)
  with check (bucket_id = 'wolf-benchmark' and false);

comment on table public.wolf_benchmark_videos is
  'WOLF AI benchmark input video catalog. Private infrastructure — not customer tenancy. '
  'Videos live in the wolf-benchmark storage bucket; rows are populated by the benchmark harness.';

comment on table public.wolf_benchmark_runs is
  'WOLF AI benchmark run records. Private infrastructure — not customer tenancy. '
  'detection_count is raw per-frame detections (not unique animals; tracking is downstream WOLF AI intelligence).';

comment on column public.wolf_benchmark_runs.detection_count is
  'Raw per-frame detections from the benchmark model. Not unique animal count.';
