-- WOLF SHARK module persistence (development / test pipeline)

create table if not exists public.shark_video_jobs (
  id uuid primary key default gen_random_uuid(),
  video_name text not null,
  status text not null check (status in ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  progress real not null default 0,
  sample_fps real not null default 2,
  configuration jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shark_model_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.shark_video_jobs(id) on delete cascade,
  model text not null,
  status text not null,
  model_version text,
  weights text,
  configuration jsonb not null default '{}'::jsonb,
  frames_analysed int not null default 0,
  detections int not null default 0,
  unique_tracks int not null default 0,
  avg_confidence real,
  max_confidence real,
  inference_seconds real,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.shark_detections (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.shark_video_jobs(id) on delete cascade,
  model text not null,
  frame_number int not null,
  timestamp_seconds real not null,
  tracking_id text,
  class_name text,
  confidence real,
  bounding_box jsonb,
  segmentation jsonb,
  model_metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.shark_tracks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.shark_video_jobs(id) on delete cascade,
  track_id text not null,
  wolf_track_id text not null,
  first_seen_seconds real,
  last_seen_seconds real,
  frame_count int,
  models text[],
  avg_confidence real,
  created_at timestamptz not null default now()
);

create table if not exists public.shark_test_results (
  id uuid primary key,
  video_name text not null,
  expected_visible_sharks int not null,
  frames_analysed int not null,
  wolf_unique_tracks int not null,
  processing_seconds real not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);
